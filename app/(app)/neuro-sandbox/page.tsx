"use client";

import { useState, useEffect } from "react";
import { useNeuroStore } from "@/lib/store/neuro-store";
import type { SensoryAndCognitiveProfile } from "@/lib/types";
import { globalMicroPacingEngine, RewardType } from "@/lib/services/micro-pacing-engine";
import { parseTextAction } from "./actions";

export default function NeuroSandboxPage() {
  const profile = useNeuroStore((state) => state.profile);
  const setReadingLevel = useNeuroStore((state) => state.setReadingLevel);
  const setVisualStimulation = useNeuroStore((state) => state.setVisualStimulation);
  
  const [inputText, setInputText] = useState("Photosynthesis is a complex biochemical process in which plants, algae, and some bacteria harness the energy of sunlight to synthesize nutrients from carbon dioxide and water.");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rewardMsg, setRewardMsg] = useState("");

  useEffect(() => {
    const unsub = globalMicroPacingEngine.onReward((type: RewardType, sound: boolean, animate: boolean) => {
      setRewardMsg(`Reward triggered: ${type} | Sound: ${sound} | Animate: ${animate}`);
      setTimeout(() => setRewardMsg(""), 3000);
    });
    return () => { unsub(); };
  }, []);

  const handleParse = async () => {
    setLoading(true);
    try {
      const result = await parseTextAction(inputText, profile.readingLevel);
      setOutputText(result);
    } catch (e) {
      console.error(e);
      setOutputText("Error formatting text.");
    } finally {
      setLoading(false);
    }
  };

  const testReward = () => {
    globalMicroPacingEngine.triggerReward("micro_quest_complete", profile.visualStimulation);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Neuro-Adaptive Sandbox</h1>
      
      <div className="space-y-4 border p-4 rounded">
        <h2 className="text-xl font-semibold">Store State</h2>
        <pre className="bg-muted p-2 rounded text-sm">{JSON.stringify(profile, null, 2)}</pre>
        
        <div className="flex gap-4">
          <select 
            value={profile.readingLevel} 
            onChange={(e) => setReadingLevel(e.target.value as SensoryAndCognitiveProfile["readingLevel"])}
            className="border p-1"
          >
            <option value="full_academic">Full Academic</option>
            <option value="plain_language">Plain Language</option>
            <option value="bulleted_synthesis">Bulleted Synthesis</option>
          </select>
          
          <select 
            value={profile.visualStimulation} 
            onChange={(e) => setVisualStimulation(e.target.value as SensoryAndCognitiveProfile["visualStimulation"])}
            className="border p-1"
          >
            <option value="high">High Stimulation</option>
            <option value="standard">Standard Stimulation</option>
            <option value="low">Low Stimulation</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 border p-4 rounded">
        <h2 className="text-xl font-semibold">Cognitive Load Manager</h2>
        <textarea 
          className="w-full border p-2 rounded" 
          rows={4} 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button 
          onClick={handleParse} 
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          {loading ? "Parsing..." : "Parse Text"}
        </button>
        {outputText && (
          <div className="mt-4 p-4 bg-muted rounded">
            <strong>Output:</strong>
            <p className="whitespace-pre-wrap mt-2">{outputText}</p>
          </div>
        )}
      </div>

      <div className="space-y-4 border p-4 rounded">
        <h2 className="text-xl font-semibold">Micro-Pacing Engine</h2>
        <button 
          onClick={testReward}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded"
        >
          Simulate Micro-Quest Complete
        </button>
        {rewardMsg && (
          <div className="text-green-600 font-medium">
            {rewardMsg}
          </div>
        )}
      </div>
    </div>
  );
}
