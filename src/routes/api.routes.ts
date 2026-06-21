import { Router } from "express";
import express from "express";
import { apiLimiter, oauthLimiter, authLimiter} from "../middleware/rateLimit.js";
import authRouter from "./auth.routes.js";
import githubAuthRouter from "./githubAuth.routes.js";
import googleAuthRouter from "./googleAuth.routes.js";
import analysesRouter from "./analyses.routes.js";
import dashboardRouter from "./dashboard.routes.js";
import historyRouter from "./history.routes.js";
import settingsRouter from "./settings.routes.js";

const apiRouter: Router = express.Router();

apiRouter.use('/api/v1/auth', authLimiter, authRouter);
// Auth routes (sharing oauthLimiter)
apiRouter.use('/auth', oauthLimiter, githubAuthRouter);
apiRouter.use('/auth', oauthLimiter, googleAuthRouter);

// Main app routes (sharing apiLimiter)
apiRouter.use('/analyses', apiLimiter, analysesRouter);
apiRouter.use('/dashboard', apiLimiter, dashboardRouter);
apiRouter.use('/history', apiLimiter, historyRouter);
apiRouter.use('/settings', apiLimiter, settingsRouter);

export default apiRouter;

