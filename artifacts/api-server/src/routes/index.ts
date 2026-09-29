import { Router, type IRouter } from "express";
import healthRouter from "./health";
import formulasRouter from "./formulas";
import constantsRouter from "./constants";
import problemsRouter from "./problems";
import glossaryRouter from "./glossary";
import favoritesRouter from "./favorites";
import searchRouter from "./search";
import statsRouter from "./stats";
import authRouter from "./auth";
import viewsRouter from "./views";
import userStatsRouter from "./userStats";
import feedbackRouter from "./feedback";
import ownerRouter from "./owner";
import achievementsRouter from "./achievements";
import limboRouter from "./limbo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(viewsRouter);
router.use(userStatsRouter);
router.use(formulasRouter);
router.use(constantsRouter);
router.use(problemsRouter);
router.use(glossaryRouter);
router.use(favoritesRouter);
router.use(searchRouter);
router.use(statsRouter);
router.use(feedbackRouter);
router.use(ownerRouter);
router.use(achievementsRouter);
router.use(limboRouter);

export default router;
