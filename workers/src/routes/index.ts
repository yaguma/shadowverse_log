import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import battleLogs from "./battle-logs";
import deckMaster from "./deck-master";
import importData from "./import";
import statistics from "./statistics";

const routes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

routes.route("/battle-logs", battleLogs);
routes.route("/deck-master", deckMaster);
routes.route("/statistics", statistics);
routes.route("/import", importData);

export default routes;
