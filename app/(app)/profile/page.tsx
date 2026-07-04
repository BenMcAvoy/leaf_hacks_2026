"use client";

import { useState } from "react";
import { RiAddLine, RiCloseLine, RiMedalLine } from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AccessibilityControls } from "@/components/accessibility-controls";
import { AppearanceControls } from "@/components/appearance-controls";
import { LearningStyleSelector } from "@/components/learning-style-selector";
import { useAuth } from "@/components/providers/auth-provider";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { getFriendlyErrorMessage } from "@/lib/firebase-errors";
import { LEARNING_STYLE_META, type LearningStyle, type UserProfile, defaultSensoryAndCognitiveProfile, defaultInterestProfile } from "@/lib/types";
import { toast } from "sonner";

type Experience = UserProfile["experience"][number];
type Qualification = UserProfile["qualifications"][number];
type LanguageEntry = UserProfile["languages"][number];

function completion(profile: UserProfile): number {
  const checks = [
    !!profile.displayName,
    !!profile.basicInfo.headline,
    !!profile.basicInfo.bio,
    !!profile.basicInfo.location,
    profile.experience.length > 0,
    profile.qualifications.length > 0,
    profile.languages.length > 0,
    profile.skills.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();

  if (!profile) return <div className="p-6 text-sm text-muted-foreground">Loading profile...</div>;

  return <ProfileForm key={profile.uid} profile={profile} updateProfile={updateProfile} />;
}

function ProfileForm({
  profile,
  updateProfile,
}: {
  profile: UserProfile;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}) {
  const [form, setForm] = useState<UserProfile>(profile);
  const [skillInput, setSkillInput] = useState("");
  const [analogyKeywordInput, setAnalogyKeywordInput] = useState("");
  const [saving, setSaving] = useState(false);
  const { voices } = useTextToSpeech();

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "We couldn't save your profile. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  function addExperience() {
    setForm((f) =>
      f ? { ...f, experience: [...f.experience, { title: "", org: "", period: "" } as Experience] } : f,
    );
  }

  function addQualification() {
    setForm((f) =>
      f ? { ...f, qualifications: [...f.qualifications, { name: "", issuer: "", year: "" } as Qualification] } : f,
    );
  }

  function addLanguage() {
    setForm((f) =>
      f ? { ...f, languages: [...f.languages, { name: "", level: "" } as LanguageEntry] } : f,
    );
  }

  function addSkill() {
    if (!skillInput.trim()) return;
    setForm((f) => (f ? { ...f, skills: [...f.skills, skillInput.trim()] } : f));
    setSkillInput("");
  }

  function addAnalogyKeyword() {
    if (!analogyKeywordInput.trim()) return;
    setForm((f) => {
      if (!f) return f;
      const ip = f.interestProfile || defaultInterestProfile;
      return { 
        ...f, 
        interestProfile: { ...ip, specificInterestKeywords: [...ip.specificInterestKeywords, analogyKeywordInput.trim()] } 
      };
    });
    setAnalogyKeywordInput("");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-semibold">{form.displayName}</h1>
        <p className="text-sm text-muted-foreground">{form.email}</p>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Profile completion</span>
            <span>{completion(form)}%</span>
          </div>
          <Progress value={completion(form)} className="h-2" />
        </div>
      </div>

      {form.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {form.badges.map((badge) => (
            <Badge key={badge} variant="secondary" className="gap-1">
              <RiMedalLine className="size-3" /> {badge}
            </Badge>
          ))}
        </div>
      )}

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-medium">Basic Information</h2>
        <Input
          value={form.basicInfo.headline}
          onChange={(e) => setForm({ ...form, basicInfo: { ...form.basicInfo, headline: e.target.value } })}
          placeholder="Headline (e.g. Second-year Biology student)"
        />
        <Textarea
          value={form.basicInfo.bio}
          onChange={(e) => setForm({ ...form, basicInfo: { ...form.basicInfo, bio: e.target.value } })}
          placeholder="Short bio"
          rows={3}
        />
        <Input
          value={form.basicInfo.location}
          onChange={(e) => setForm({ ...form, basicInfo: { ...form.basicInfo, location: e.target.value } })}
          placeholder="Location"
        />
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Experience</h2>
          <Button size="sm" variant="ghost" onClick={addExperience}>
            <RiAddLine className="size-4" /> Add
          </Button>
        </div>
        {form.experience.map((exp, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border p-3">
            <Input
              value={exp.title}
              onChange={(e) => {
                const experience = [...form.experience];
                experience[i] = { ...exp, title: e.target.value };
                setForm({ ...form, experience });
              }}
              placeholder="Title"
            />
            <Input
              value={exp.org}
              onChange={(e) => {
                const experience = [...form.experience];
                experience[i] = { ...exp, org: e.target.value };
                setForm({ ...form, experience });
              }}
              placeholder="Organization"
            />
            <Input
              value={exp.period}
              onChange={(e) => {
                const experience = [...form.experience];
                experience[i] = { ...exp, period: e.target.value };
                setForm({ ...form, experience });
              }}
              placeholder="Period (e.g. 2023 - Present)"
            />
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Qualifications</h2>
          <Button size="sm" variant="ghost" onClick={addQualification}>
            <RiAddLine className="size-4" /> Add
          </Button>
        </div>
        {form.qualifications.map((q, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border p-3">
            <Input
              value={q.name}
              onChange={(e) => {
                const qualifications = [...form.qualifications];
                qualifications[i] = { ...q, name: e.target.value };
                setForm({ ...form, qualifications });
              }}
              placeholder="Qualification name"
            />
            <Input
              value={q.issuer}
              onChange={(e) => {
                const qualifications = [...form.qualifications];
                qualifications[i] = { ...q, issuer: e.target.value };
                setForm({ ...form, qualifications });
              }}
              placeholder="Issuer"
            />
            <Input
              value={q.year}
              onChange={(e) => {
                const qualifications = [...form.qualifications];
                qualifications[i] = { ...q, year: e.target.value };
                setForm({ ...form, qualifications });
              }}
              placeholder="Year"
            />
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Languages</h2>
          <Button size="sm" variant="ghost" onClick={addLanguage}>
            <RiAddLine className="size-4" /> Add
          </Button>
        </div>
        {form.languages.map((lang, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={lang.name}
              onChange={(e) => {
                const languages = [...form.languages];
                languages[i] = { ...lang, name: e.target.value };
                setForm({ ...form, languages });
              }}
              placeholder="Language"
            />
            <Input
              value={lang.level}
              onChange={(e) => {
                const languages = [...form.languages];
                languages[i] = { ...lang, level: e.target.value };
                setForm({ ...form, languages });
              }}
              placeholder="Level (e.g. Fluent)"
            />
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-medium">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {form.skills.map((skill, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {skill}
              <button
                onClick={() => setForm({ ...form, skills: form.skills.filter((_, j) => j !== i) })}
                aria-label={`Remove ${skill}`}
              >
                <RiCloseLine className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Add a skill and press Enter"
          />
          <Button variant="outline" onClick={addSkill}>
            Add
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <h2 className="text-sm font-medium">Learning style</h2>
        <LearningStyleSelector
          value={form.learningStyle}
          onChange={(learningStyle) => setForm({ ...form, learningStyle })}
        />

<<<<<<< HEAD
        <h2 className="mt-4 text-sm font-medium">Sensory & Cognitive Profile</h2>
        <div className="flex flex-col gap-2">
          <Label>Reading Level</Label>
          <Select
            value={form.sensoryProfile?.readingLevel ?? "full_academic"}
            onValueChange={(v: any) =>
              setForm({ 
                ...form, 
                sensoryProfile: { ...(form.sensoryProfile || defaultSensoryAndCognitiveProfile), readingLevel: v } 
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_academic">Full Academic</SelectItem>
              <SelectItem value="plain_language">Plain Language</SelectItem>
              <SelectItem value="bulleted_synthesis">Bulleted Synthesis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Label>Visual Stimulation</Label>
          <Select
            value={form.sensoryProfile?.visualStimulation ?? "standard"}
            onValueChange={(v: any) =>
              setForm({ 
                ...form, 
                sensoryProfile: { ...(form.sensoryProfile || defaultSensoryAndCognitiveProfile), visualStimulation: v } 
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="low">Low (Dyslexia-friendly/Reduced Motion)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Label>Cognitive Load Limit (Cards per session)</Label>
          <Input 
            type="number"
            value={form.sensoryProfile?.cognitiveLoadLimit ?? 20}
            onChange={(e) => 
              setForm({ 
                ...form, 
                sensoryProfile: { ...(form.sensoryProfile || defaultSensoryAndCognitiveProfile), cognitiveLoadLimit: parseInt(e.target.value) || 20 } 
              })
            }
          />
        </div>

        <h2 className="mt-4 text-sm font-medium">Appearance</h2>
        <AppearanceControls />

        <h2 className="mt-4 text-sm font-medium">Accessibility</h2>
        <AccessibilityControls
          value={form.accessibility}
          onChange={(accessibility) => setForm({ ...form, accessibility })}
        />
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <h2 className="text-sm font-medium">Hyper-Fixation Analogy Engine</h2>
        <div className="flex items-center justify-between">
          <Label aria-label="Enable Hyper-Fixation Analogy Engine">Enable Engine</Label>
          <Switch
            checked={form.interestProfile?.analogyEngineEnabled ?? false}
            onCheckedChange={(v) =>
              setForm({ 
                ...form, 
                interestProfile: { ...(form.interestProfile || defaultInterestProfile), analogyEngineEnabled: v } 
              })
            }
          />
        </div>

        {(form.interestProfile?.analogyEngineEnabled) && (
          <div className="flex flex-col gap-4 border-t pt-4">
            <div className="flex flex-col gap-2">
              <Label>Primary Interest Category</Label>
              <Input
                placeholder="e.g. Video Games, Anime, Sports..."
                value={form.interestProfile?.primaryInterestCategory ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    interestProfile: { ...(form.interestProfile || defaultInterestProfile), primaryInterestCategory: e.target.value }
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Specific Interest Keywords</Label>
              <div className="flex flex-wrap gap-2">
                {(form.interestProfile?.specificInterestKeywords || []).map((keyword, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {keyword}
                    <button
                      onClick={() => {
                        const ip = form.interestProfile || defaultInterestProfile;
                        setForm({
                          ...form,
                          interestProfile: {
                            ...ip,
                            specificInterestKeywords: ip.specificInterestKeywords.filter((_, j) => j !== i)
                          }
                        });
                      }}
                      aria-label={`Remove ${keyword} tag`}
                    >
                      <RiCloseLine className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="analogyKeywordInput"
                  value={analogyKeywordInput}
                  onChange={(e) => setAnalogyKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAnalogyKeyword();
                    }
                  }}
                  placeholder="e.g. Minecraft Redstone"
                />
                <Button variant="outline" onClick={addAnalogyKeyword}>
                  Add
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Intensity Scale</Label>
              <Tabs
                value={form.interestProfile?.intensityScale ?? "subtle"}
                onValueChange={(v: any) =>
                  setForm({
                    ...form,
                    interestProfile: { ...(form.interestProfile || defaultInterestProfile), intensityScale: v }
                  })
                }
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="subtle">Subtle</TabsTrigger>
                  <TabsTrigger value="immersive">Immersive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}
      </Card>

      <Button onClick={save} disabled={saving} size="lg">
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
