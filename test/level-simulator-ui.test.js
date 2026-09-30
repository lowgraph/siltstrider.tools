const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { JSDOM } = require("jsdom");
const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;

function component(file, exportName = "default") {
  const result = require("esbuild").buildSync({
    entryPoints: [path.resolve(file)],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime"]
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return m.exports[exportName];
}

const mockCatalogs = {
  races: {
    "Dark Elf": {
      name: "Dark Elf",
      male: { Strength: 40, Intelligence: 40, Willpower: 30, Agility: 40, Speed: 50, Endurance: 40, Personality: 30, Luck: 40 },
      female: { Strength: 35, Intelligence: 40, Willpower: 30, Agility: 40, Speed: 50, Endurance: 35, Personality: 40, Luck: 40 },
      bonuses: { "Short Blade": 10, Destruction: 10, "Light Armor": 5, Athletics: 5, Mysticism: 5, Marksman: 5 }
    }
  },
  classes: {
    Assassin: {
      name: "Assassin",
      spec: "Stealth",
      fav1: "Speed",
      fav2: "Intelligence",
      maj: ["Sneak", "Marksman", "Light Armor", "Short Blade", "Security"],
      min: ["Acrobatics", "Alchemy", "Block", "Alteration", "Hand-to-hand"]
    }
  },
  signs: {
    "The Lady": {
      name: "The Lady",
      attrs: { Personality: 25, Endurance: 25 }
    }
  },
  specSkills: {
    Combat: ["Armorer", "Athletics", "Axe", "Block", "Blunt Weapon", "Heavy Armor", "Long Blade", "Medium Armor", "Spear"],
    Magic: ["Alchemy", "Alteration", "Conjuration", "Destruction", "Enchant", "Illusion", "Mysticism", "Restoration", "Unarmored"],
    Stealth: ["Acrobatics", "Hand-to-hand", "Light Armor", "Marksman", "Mercantile", "Security", "Short Blade", "Sneak", "Speechcraft"]
  }
};

const mockBuild = {
  race: "Dark Elf",
  gender: "Male",
  className: "Assassin",
  sign: "The Lady",
  spec: "Stealth",
  fav1: "Speed",
  fav2: "Intelligence",
  maj: ["Sneak", "Marksman", "Light Armor", "Short Blade", "Security"],
  min: ["Acrobatics", "Alchemy", "Block", "Alteration", "Hand-to-hand"]
};

test("LevelModeToggle switches between Stats Only and Stats & Skills", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const LevelModeToggle = component("components/level-simulator/level-mode-toggle.jsx");
  const root = createRoot(document.getElementById("root"));
  let currentMode = "stats_only";

  try {
    await act(async () => {
      root.render(
        React.createElement(LevelModeToggle, {
          mode: currentMode,
          onModeChange: (m) => {
            currentMode = m;
          }
        })
      );
    });

    const buttons = document.querySelectorAll("button");
    assert.equal(buttons.length, 2);
    assert.equal(buttons[0].textContent.trim(), "Stats Only");
    assert.equal(buttons[0].getAttribute("aria-pressed"), "true");
    assert.equal(buttons[1].getAttribute("aria-pressed"), "false");

    await act(async () => {
      buttons[1].click();
    });
    assert.equal(currentMode, "stats_and_skills");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("AttributePriorityRanker allows archetype selection and rank reordering", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const AttributePriorityRanker = component("components/level-simulator/attribute-priority-ranker.jsx");
  const root = createRoot(document.getElementById("root"));

  const priority = ["Endurance", "Agility", "Strength", "Speed", "Intelligence", "Personality", "Willpower", "Luck"];
  let selectedArch = "stealth";
  let updatedPriority = null;

  try {
    await act(async () => {
      root.render(
        React.createElement(AttributePriorityRanker, {
          priority,
          archetypeId: selectedArch,
          detectedArchetype: { id: "stealth", name: "Stealth / Assassin / Marksman" },
          onSelectArchetype: (id) => {
            selectedArch = id;
          },
          onReorderPriority: (p) => {
            updatedPriority = p;
          }
        })
      );
    });

    const select = document.querySelector("select");
    assert.ok(select);
    assert.equal(select.value, "stealth");

    // Check detected badge
    assert.match(document.body.textContent, /Stealth \/ Assassin \/ Marksman/);

    // Verify all attribute reorder buttons meet the 24px target size (w-6 h-6)
    const moveButtons = Array.from(document.querySelectorAll('button[title^="Move"]'));
    assert.equal(moveButtons.length, priority.length * 2, "must have 2 buttons per attribute");
    for (const btn of moveButtons) {
      assert.ok(btn.classList.contains("w-6"), `button ${btn.getAttribute("aria-label")} must have w-6 (24px)`);
      assert.ok(btn.classList.contains("h-6"), `button ${btn.getAttribute("aria-label")} must have h-6 (24px)`);
    }

    // Boundary disabled states
    const firstUp = document.querySelector('button[aria-label="Move Endurance up"]');
    const firstDown = document.querySelector('button[aria-label="Move Endurance down"]');
    const lastUp = document.querySelector('button[aria-label="Move Luck up"]');
    const lastDown = document.querySelector('button[aria-label="Move Luck down"]');

    assert.ok(firstUp.disabled, "First attribute up button must be disabled");
    assert.ok(!firstDown.disabled, "First attribute down button must be enabled");
    assert.ok(!lastUp.disabled, "Last attribute up button must be enabled");
    assert.ok(lastDown.disabled, "Last attribute down button must be disabled");

    // Click move down on Endurance
    await act(async () => {
      firstDown.click();
    });
    assert.ok(updatedPriority, "onReorderPriority should be invoked on click");
    assert.equal(updatedPriority[0], "Agility");
    assert.equal(updatedPriority[1], "Endurance");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial: AttributePriorityRanker handles single-item and empty arrays gracefully", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const AttributePriorityRanker = component("components/level-simulator/attribute-priority-ranker.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    // 1. Single attribute in list
    let singleReorderCalled = false;
    await act(async () => {
      root.render(
        React.createElement(AttributePriorityRanker, {
          priority: ["Endurance"],
          archetypeId: "custom",
          detectedArchetype: null,
          onSelectArchetype() {},
          onReorderPriority() {
            singleReorderCalled = true;
          }
        })
      );
    });

    const buttons = document.querySelectorAll('button[title^="Move"]');
    assert.equal(buttons.length, 2);
    assert.ok(buttons[0].disabled, "single-item list up button must be disabled");
    assert.ok(buttons[1].disabled, "single-item list down button must be disabled");
    for (const btn of buttons) {
      assert.ok(btn.classList.contains("w-6") && btn.classList.contains("h-6"));
    }

    // 2. Empty priority array
    await act(async () => {
      root.render(
        React.createElement(AttributePriorityRanker, {
          priority: [],
          archetypeId: "custom",
          detectedArchetype: null,
          onSelectArchetype() {},
          onReorderPriority() {}
        })
      );
    });

    const emptyButtons = document.querySelectorAll('button[title^="Move"]');
    assert.equal(emptyButtons.length, 0, "empty list renders zero buttons without throw");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("LevelItineraryCard renders 5x multiplier Misc skill training recommendations", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const LevelItineraryCard = component("components/level-simulator/level-itinerary-card.jsx");
  const root = createRoot(document.getElementById("root"));

  const mockStep = {
    level: 1,
    nextLevel: 2,
    attributeBonuses: [
      { attribute: "Endurance", bonus: 5, startValue: 65, endValue: 70 },
      { attribute: "Strength", bonus: 5, startValue: 40, endValue: 45 },
      { attribute: "Agility", bonus: 5, startValue: 40, endValue: 45 }
    ],
    majorMinorIncreases: { Sneak: 5, Marksman: 5 },
    miscTraining: [
      { skill: "Spear", points: 10, startValue: 5, endValue: 15, cost: 95, attribute: "Endurance" },
      { skill: "Armorer", points: 10, startValue: 5, endValue: 15, cost: 95, attribute: "Strength" }
    ],
    totalTrainingCost: 190,
    healthGain: 7,
    newEndurance: 70,
    newHealth: 67
  };

  try {
    await act(async () => {
      root.render(React.createElement(LevelItineraryCard, { step: mockStep, isStatsOnly: false }));
    });

    assert.match(document.body.textContent, /Level 1 → Level 2/);
    assert.match(document.body.textContent, /\+7 HP Gain/);
    assert.match(document.body.textContent, /Endurance/);
    assert.match(document.body.textContent, /Spear/);
    assert.match(document.body.textContent, /Armorer/);
    assert.match(document.body.textContent, /Train \+10 pts/);
    assert.match(document.body.textContent, /190 Septims/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("HealthGrowthChart renders SVG curves with positive HP advantage", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const HealthGrowthChart = component("components/level-simulator/health-growth-chart.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      root.render(
        React.createElement(HealthGrowthChart, {
          character: mockBuild,
          targetLevel: 25,
          catalogs: mockCatalogs,
          options: {}
        })
      );
    });

    const svg = document.querySelector("svg");
    assert.ok(svg, "SVG chart must render");
    const paths = document.querySelectorAll("svg path");
    assert.ok(paths.length >= 2, "SVG must contain comparison paths");
    assert.match(document.body.textContent, /HP Advantage/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("SkillProgressionMatrix renders 27 skills and filters by specialization", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const SkillProgressionMatrix = component("components/level-simulator/skill-progression-matrix.jsx");
  const root = createRoot(document.getElementById("root"));

  const initialSkills = { Sneak: 35, Marksman: 35, Spear: 5, Armorer: 5 };
  const currentSkills = { Sneak: 45, Marksman: 40, Spear: 15, Armorer: 10 };

  try {
    await act(async () => {
      root.render(
        React.createElement(SkillProgressionMatrix, {
          initialSkills,
          currentSkills,
          maj: ["Sneak", "Marksman"],
          min: ["Block"]
        })
      );
    });

    // Verify filter buttons
    const filterBtns = document.querySelectorAll(".inline-flex button");
    assert.equal(filterBtns.length, 4);

    // Verify skill cards count for "all" is 27
    const cards = document.querySelectorAll(".grid > div");
    assert.equal(cards.length, 27);

    // Check Major / Minor / Misc tagging
    assert.match(document.body.textContent, /Major/);
    assert.match(document.body.textContent, /Minor/);
    assert.match(document.body.textContent, /Misc/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("LevelStepEditor provides 1-click presets and target level slider", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const LevelStepEditor = component("components/level-simulator/level-step-editor.jsx");
  const root = createRoot(document.getElementById("root"));

  let appliedStrat = "";
  let newLevel = 50;

  try {
    await act(async () => {
      root.render(
        React.createElement(LevelStepEditor, {
          currentState: { level: 1, attributes: { Endurance: 65, Strength: 40 }, health: 50 },
          initialSheet: { level: 1, attributes: { Endurance: 65, Strength: 40 }, health: 50 },
          stepIndex: 0,
          steps: [],
          targetLevel: 50,
          levelCap: 62,
          priority: ["Endurance", "Strength", "Agility"],
          archetypeId: "warrior",
          detectedArchetype: { id: "warrior", name: "Warrior" },
          strategy: "auto",
          mode: "stats_only",
          onStepIndexChange() {},
          onTargetLevelChange(lvl) {
            newLevel = lvl;
          },
          onSelectArchetype() {},
          onReorderPriority() {},
          onApplyStrategy(s) {
            appliedStrat = s;
          },
          onResetPlan() {},
          onApplyManualStep() {}
        })
      );
    });

    // Test preset clicks
    const rushBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Rush Endurance")
    );
    assert.ok(rushBtn);
    await act(async () => {
      rushBtn.click();
    });
    assert.equal(appliedStrat, "rush_endurance");

    // Test slider
    const slider = document.querySelector('input[type="range"]');
    assert.ok(slider);
    assert.equal(slider.value, "50");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("LVL-3: the priority list uses the sheet's three-letter names, and screen readers still hear the full name", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const AttributePriorityRanker = component("components/level-simulator/attribute-priority-ranker.jsx");
  const root = createRoot(document.getElementById("root"));
  const priority = ["Endurance", "Personality", "Strength", "Willpower", "Intelligence", "Agility", "Speed", "Luck", "Mysticality"];
  try {
    await act(async () => root.render(React.createElement(AttributePriorityRanker, {
      priority, archetypeId: "custom", detectedArchetype: null, onSelectArchetype() {}, onReorderPriority() {}
    })));
    const tiles = [...document.querySelectorAll(".priority-list > div")];
    assert.equal(tiles.length, priority.length);
    const shown = tiles.map((tile) => tile.querySelector('[aria-hidden="true"]').textContent.trim());
    assert.deepEqual(shown, ["END", "PER", "STR", "WIL", "INT", "AGI", "SPD", "LUC", "MYS"], "an unknown name falls back to its first three letters");
    assert.deepEqual(tiles.map((tile) => tile.querySelector(".sr-only").textContent), priority, "the full name for screen readers");
    assert.deepEqual(tiles.map((tile) => tile.querySelector("[title]").getAttribute("title")), priority, "and on hover");
    assert.equal(document.querySelectorAll(".priority-list .truncate").length, 0, "nothing is cut off");
    assert.equal(document.querySelector('button[aria-label="Move Personality up"]') !== null, true, "the buttons keep the full name");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});