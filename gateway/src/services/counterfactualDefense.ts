import {
  calculateRisk,
  type RiskResult,
  type RiskSignal,
} from "./riskEngine.js";

export interface CounterfactualScenario {
  name: string;
  description: string;
  removeSignals?: string[];
  businessFlowScore?: number;
}

export interface CounterfactualResult {
  scenario: string;
  description: string;
  originalScore: number;
  originalLevel: RiskResult["level"];
  originalAction: RiskResult["action"];
  simulatedScore: number;
  simulatedLevel: RiskResult["level"];
  simulatedAction: RiskResult["action"];
  changed: boolean;
  explanation: string;
}

export function simulateCounterfactual(
  originalRisk: RiskResult,
  scenario: CounterfactualScenario
): CounterfactualResult {
  const removeSignals = new Set(
    scenario.removeSignals ?? []
  );

  const simulatedSignals: RiskSignal[] =
    originalRisk.signals.map((signal) => ({
      name: signal.name,
      score: signal.score,
      detected: removeSignals.has(signal.name)
        ? false
        : signal.detected,
    }));

  // Allow the scenario to override the business-flow
  // contribution without changing the real request.
  if (scenario.businessFlowScore !== undefined) {
    const businessFlowIndex =
      simulatedSignals.findIndex(
        (signal) => signal.name === "businessFlow"
      );

    if (businessFlowIndex >= 0) {
      const existingSignal =
        simulatedSignals[businessFlowIndex];

      if (existingSignal) {
        simulatedSignals[businessFlowIndex] = {
          name: existingSignal.name,
          score: scenario.businessFlowScore,
          detected: scenario.businessFlowScore > 0,
        };
      }
    } else {
      simulatedSignals.push({
        name: "businessFlow",
        score: scenario.businessFlowScore,
        detected: scenario.businessFlowScore > 0,
      });
    }
  }

  const simulatedRisk =
    calculateRisk(simulatedSignals);

  const changed =
    originalRisk.score !== simulatedRisk.score ||
    originalRisk.level !== simulatedRisk.level ||
    originalRisk.action !== simulatedRisk.action;

  const explanation = changed
    ? `Security decision changes from ${originalRisk.action} to ${simulatedRisk.action} with a risk score change from ${originalRisk.score} to ${simulatedRisk.score}.`
    : "The simulated change did not alter the security decision.";

  return {
    scenario: scenario.name,
    description: scenario.description,
    originalScore: originalRisk.score,
    originalLevel: originalRisk.level,
    originalAction: originalRisk.action,
    simulatedScore: simulatedRisk.score,
    simulatedLevel: simulatedRisk.level,
    simulatedAction: simulatedRisk.action,
    changed,
    explanation,
  };
}