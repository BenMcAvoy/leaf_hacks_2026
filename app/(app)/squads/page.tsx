"use client";

import { useEffect, useState } from "react";
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
import type { Squad, UserProfile } from "@/lib/types";
import { toast } from "sonner";

export default function SquadsPage() {
  const { user, profile, updateProfile } = useAuth();
  const [squads, setSquads] = useState<(Squad & { id: string })[]>([]);
  const [leaders, setLeaders] = useState<(UserProfile & { id: string })[]>([]);
  const [newSquadName, setNewSquadName] = useState("");
  const brainiac = useBrainiac();

  useEffect(() => {
    return subscribeToCollection<Squad>("squads", setSquads, orderBy("totalXp", "desc"), limit(20));
  }, []);

  useEffect(() => {
    return subscribeToCollection<UserProfile>("users", setLeaders, orderBy("xp", "desc"), limit(20));
  }, []);

  const mySquad = squads.find((s) => s.id === profile?.squadId);

  async function createSquad() {
    if (!user || !newSquadName.trim()) return;
    try {
      const id = await addDocument<Squad>("squads", {
        name: newSquadName.trim(),
        memberIds: [user.uid],
        totalXp: 0,
        weeklyChallenge: "Complete 3 quizzes as a squad this week",
      });
      await updateProfile({ squadId: id });
      setNewSquadName("");
    } catch (err) {
      const message = getFriendlyErrorMessage(err, "We couldn't create your squad. Please try again.");
      toast.error(message);
      brainiac.show("error", message);
    }
  }

  async function joinSquad(squad: Squad & { id: string }) {
    if (!user) return;
    if (squad.memberIds.includes(user.uid)) return;
    try {
      await updateDocument<Squad>("squads", squad.id, {
        memberIds: [...squad.memberIds, user.uid],
      });
      await updateProfile({ squadId: squad.id });
    } catch (err) {
      const message = getFriendlyErrorMessage(err, "We couldn't join that squad. Please try again.");
      toast.error(message);
      brainiac.show("error", message);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold">Study Squads</h1>

      {mySquad ? (
        <Card className="flex flex-col gap-2 border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <RiTeamLine className="size-4 text-primary" /> {mySquad.name}
          </div>
          <p className="text-sm text-muted-foreground">{mySquad.weeklyChallenge}</p>
          <p className="text-xs text-muted-foreground">
            {mySquad.memberIds.length} members - {mySquad.totalXp} total XP
          </p>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-sm text-muted-foreground">You are not in a squad yet.</p>
          <div className="flex gap-2">
            <Input
              value={newSquadName}
              onChange={(e) => setNewSquadName(e.target.value)}
              placeholder="Name your squad"
            />
            <Button onClick={createSquad} disabled={!newSquadName.trim()}>
              Create
            </Button>
          </div>
        </Card>
      )}

      <Tabs defaultValue="individuals">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="individuals">
            <RiUserLine className="size-4" /> Individuals
          </TabsTrigger>
          <TabsTrigger value="squads">
            <RiTeamLine className="size-4" /> Squads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individuals" className="flex flex-col gap-2">
          {leaders.map((leader, i) => (
            <Card key={leader.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Badge variant={i < 3 ? "default" : "secondary"}>{i + 1}</Badge>
                <span className="text-sm font-medium">{leader.displayName}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <RiTrophyLine className="size-4" /> {leader.xp} XP
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="squads" className="flex flex-col gap-2">
          {squads.map((squad, i) => (
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
                  <Button size="sm" variant="outline" onClick={() => joinSquad(squad)}>
                    Join
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
