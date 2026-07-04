"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RiTeamLine, RiTrophyLine, RiUserLine } from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useBrainiac } from "@/components/providers/brainiac-provider";
import {
  addDocument,
  orderBy,
  limit,
  subscribeToCollection,
  updateDocument,
} from "@/lib/firestore";
import { getFriendlyErrorMessage } from "@/lib/firebase-errors";
import { MotionItem, MotionPage, MotionPress, MotionStagger } from "@/components/motion-primitives";
import { MOCK_LEADERS, MOCK_SPHERES } from "@/lib/mock-data";
import type { Squad, UserProfile } from "@/lib/types";
import { toast } from "sonner";

export default function SquadsPage() {
  const { user, profile, updateProfile } = useAuth();
  const [squads, setSquads] = useState<(Squad & { id: string })[]>([]);
  const [leaders, setLeaders] = useState<(UserProfile & { id: string })[]>([]);
  const [newSquadName, setNewSquadName] = useState("");
  const brainiac = useBrainiac();

  useEffect(() => {
    if (!user) return;
    return subscribeToCollection<Squad>("squads", setSquads, orderBy("totalXp", "desc"), limit(20));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeToCollection<UserProfile>("users", setLeaders, orderBy("xp", "desc"), limit(20));
  }, [user]);

  const displayedLeaders = leaders.length ? leaders : MOCK_LEADERS;
  const displayedSpheres = squads.length ? squads : MOCK_SPHERES;
  const mySquad = displayedSpheres.find((s) => s.id === profile?.squadId);

  async function createSquad() {
    if (!newSquadName.trim()) return;
    if (!user) {
      await updateProfile({ squadId: "sphere-demo-created" });
      toast.success(`${newSquadName.trim()} created`);
      setNewSquadName("");
      return;
    }
    try {
      const id = await addDocument<Squad>("squads", {
        name: newSquadName.trim(),
        memberIds: [user.uid],
        totalXp: 0,
        weeklyChallenge: "Complete 3 quizzes as a sphere this week",
      });
      await updateProfile({ squadId: id });
      setNewSquadName("");
    } catch (err) {
      const message = getFriendlyErrorMessage(err, "We couldn't create your sphere. Please try again.");
      toast.error(message);
      brainiac.show("error", message);
    }
  }

  async function joinSquad(squad: Squad & { id: string }) {
    if (!user) {
      await updateProfile({ squadId: squad.id });
      toast.success(`Joined ${squad.name}`);
      return;
    }
    if (squad.memberIds.includes(user.uid)) return;
    try {
      await updateDocument<Squad>("squads", squad.id, {
        memberIds: [...squad.memberIds, user.uid],
      });
      await updateProfile({ squadId: squad.id });
    } catch (err) {
      const message = getFriendlyErrorMessage(err, "We couldn't join that sphere. Please try again.");
      toast.error(message);
      brainiac.show("error", message);
    }
  }

  return (
    <MotionPage className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <MotionItem>
        <h1 className="text-xl font-semibold">Study Spheres</h1>
      </MotionItem>

      {mySquad ? (
        <MotionItem>
        <Card className="flex flex-col gap-2 border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <RiTeamLine className="size-4 text-primary" /> {mySquad.name}
          </div>
          <p className="text-sm text-muted-foreground">{mySquad.weeklyChallenge}</p>
          <p className="text-xs text-muted-foreground">
            {mySquad.memberIds.length} members - {mySquad.totalXp} total XP
          </p>
        </Card>
        </MotionItem>
      ) : (
        <MotionItem>
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-sm text-muted-foreground">You are not in a Study Sphere yet.</p>
          <div className="flex gap-2">
            <Input
              value={newSquadName}
              onChange={(e) => setNewSquadName(e.target.value)}
              placeholder="Name your sphere"
            />
            <Button onClick={createSquad} disabled={!newSquadName.trim()}>
              Create
            </Button>
          </div>
        </Card>
        </MotionItem>
      )}

      <MotionItem>
      <Tabs defaultValue="individuals">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="individuals">
            <RiUserLine className="size-4" /> Individuals
          </TabsTrigger>
          <TabsTrigger value="squads">
            <RiTeamLine className="size-4" /> Spheres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individuals" className="flex flex-col gap-2">
          <MotionStagger className="flex flex-col gap-2">
          {displayedLeaders.map((leader, i) => (
            <MotionItem key={leader.id}>
            <Card key={leader.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={i < 3 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <Badge variant={i < 3 ? "default" : "secondary"}>{i + 1}</Badge>
                </motion.div>
                <span className="text-sm font-medium">{leader.displayName}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <RiTrophyLine className="size-4" aria-hidden /> {leader.xp} XP
              </div>
            </Card>
            </MotionItem>
          ))}
          </MotionStagger>
        </TabsContent>

        <TabsContent value="squads" className="flex flex-col gap-2">
          <MotionStagger className="flex flex-col gap-2">
          {displayedSpheres.map((squad, i) => (
            <MotionItem key={squad.id}>
            <Card key={squad.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Badge variant={i < 3 ? "default" : "secondary"}>{i + 1}</Badge>
                <div>
                  <p className="text-sm font-medium">{squad.name}</p>
                  <p className="text-xs text-muted-foreground">{squad.memberIds.length} members</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{squad.totalXp} XP</span>
                {squad.id !== profile?.squadId && (
                  <MotionPress>
                  <Button size="sm" variant="outline" onClick={() => joinSquad(squad)}>
                    Join
                  </Button>
                  </MotionPress>
                )}
              </div>
            </Card>
            </MotionItem>
          ))}
          </MotionStagger>
        </TabsContent>
      </Tabs>
      </MotionItem>
    </MotionPage>
  );
}
