import { Router } from "express";
import { getSettings, updateSettings } from "../store.js";

export const settingsRouter = Router();

settingsRouter.get("/", (_req, res) => {
  res.json(getSettings());
});

settingsRouter.patch("/", (req, res) => {
  const current = getSettings();
  const { weeklyGoalHours, categories } = req.body as {
    weeklyGoalHours?: number;
    categories?: string[];
  };

  const next = {
    weeklyGoalHours: weeklyGoalHours ?? current.weeklyGoalHours,
    categories: categories ?? current.categories,
  };

  updateSettings(next);
  res.json(next);
});
