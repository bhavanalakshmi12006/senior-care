import { Router } from "express";
import { register, login, quickDemoLogin, googleAuth, getMe, updateProfile, changePassword } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/quick-demo-login", quickDemoLogin);
router.post("/google", googleAuth);
router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);
router.get("/seniors-directory", async (req, res) => {
  try {
    const Senior = (await import("../models/Senior.js")).default;
    const seniors = await Senior.find({ status: "active" }, "name age gender phone roomNumber photoUrl emergencyContactPhone address").sort({ name: 1 });
    res.json({ seniors });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch seniors directory", error: e.message });
  }
});
router.post("/change-password", authenticate, changePassword);

export default router;
