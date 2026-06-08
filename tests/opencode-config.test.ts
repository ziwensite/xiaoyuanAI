import { describe, it, expect } from "vitest";
import { filterAgents, flattenProviders, extractModelsFromConfig } from "../src/opencode-config";

describe("filterAgents", () => {
  it("filters primary non-hidden agents", () => {
    const agents = [
      { mode: "primary", name: "build", description: "Build agent", hidden: false },
      { mode: "primary", name: "plan", description: "Plan agent", hidden: false },
    ];
    const result = filterAgents(agents);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("build");
  });

  it("excludes hidden agents", () => {
    const agents = [
      { mode: "primary", name: "build", description: "Build agent", hidden: false },
      { mode: "primary", name: "secret", description: "Secret agent", hidden: true },
    ];
    const result = filterAgents(agents);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("build");
  });

  it("excludes non-primary agents", () => {
    const agents = [
      { mode: "primary", name: "build", hidden: false },
      { mode: "secondary", name: "helper", hidden: false },
    ];
    const result = filterAgents(agents);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("build");
  });

  it("returns empty array for empty input", () => {
    expect(filterAgents([])).toEqual([]);
  });
});

describe("flattenProviders", () => {
  it("flattens a single provider with one model", () => {
    const providers = [{
      id: "test-provider",
      name: "Test",
      models: { m1: { id: "model-a", name: "Model A", enabled: true, capabilities: { input: { text: true } } } },
    }];
    const result = flattenProviders(providers);
    expect(result.models).toHaveLength(1);
    expect(result.models[0].id).toBe("test-provider/model-a");
    expect(result.caps["test-provider/model-a"]).toBeDefined();
  });

  it("skips disabled providers", () => {
    const providers = [
      { id: "disabled-provider", name: "Disabled", configured: false, models: { m1: { id: "model", name: "Model" } } },
      { id: "enabled", name: "Active", models: { m1: { id: "active-model", name: "Active Model" } } },
    ];
    const result = flattenProviders(providers);
    expect(result.models).toHaveLength(1);
    expect(result.models[0].id).toBe("enabled/active-model");
  });

  it("skips disabled models", () => {
    const providers = [{
      id: "p", name: "P",
      models: { m1: { id: "enabled-model", name: "Enabled", enabled: true }, m2: { id: "disabled-model", name: "Disabled", enabled: false } },
    }];
    const result = flattenProviders(providers);
    expect(result.models).toHaveLength(1);
    expect(result.models[0].id).toBe("p/enabled-model");
  });

  it("flattens multiple providers", () => {
    const providers = [
      { id: "p1", name: "P1", models: { m1: { id: "model1", name: "Model 1" } } },
      { id: "p2", name: "P2", models: { m1: { id: "model2", name: "Model 2" } } },
    ];
    const result = flattenProviders(providers);
    expect(result.models).toHaveLength(2);
  });

  it("handles models as array", () => {
    const providers = [{
      id: "p", name: "P",
      models: [{ id: "array-model", name: "Array Model", enabled: true }],
    }];
    const result = flattenProviders(providers);
    expect(result.models).toHaveLength(1);
  });

  it("populates caps from capabilities", () => {
    const providers = [{
      id: "p", name: "P",
      models: { m1: { id: "cap-model", name: "Cap Model", capabilities: { input: { text: true, image: true }, reasoning: true, toolcall: true } } },
    }];
    const result = flattenProviders(providers);
    const caps = result.caps["p/cap-model"];
    expect(caps?.text).toBe(true);
    expect(caps?.image).toBe(true);
    expect(caps?.reasoning).toBe(true);
    expect(caps?.toolcall).toBe(true);
    expect(caps?.audio).toBe(false);
  });
});

describe("extractModelsFromConfig", () => {
  it("extracts models from providers config", () => {
    const config = {
      providers: {
        provider1: {
          name: "Provider 1",
          models: { m1: { id: "model1", name: "Model 1" } },
        },
      },
    };
    const models = extractModelsFromConfig(config);
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe("provider1/model1");
  });

  it("extracts models from profiles as fallback", () => {
    const config = {
      profiles: {
        profile1: {
          name: "Profile 1",
          models: { m1: { id: "model-a", name: "Model A" } },
        },
      },
    };
    const models = extractModelsFromConfig(config);
    expect(models).toHaveLength(1);
  });

  it("handles models array format", () => {
    const config = {
      providers: {
        p1: {
          models: [{ id: "array-model", name: "Array Model" }],
        },
      },
    };
    const models = extractModelsFromConfig(config);
    expect(models).toHaveLength(1);
  });

  it("handles top-level models array", () => {
    const config = { models: ["provider1/model1", "provider2/model2"] };
    const models = extractModelsFromConfig(config);
    expect(models).toHaveLength(2);
  });

  it("returns empty array for empty config", () => {
    expect(extractModelsFromConfig({})).toEqual([]);
  });

  it("uses name as fallback id when no id provided", () => {
    const config = {
      providers: {
        p1: {
          models: { m1: { name: "NameAsId" } },
        },
      },
    };
    const models = extractModelsFromConfig(config);
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe("p1/NameAsId");
  });
});