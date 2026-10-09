import { Router } from "express";
import { 
  getAppointments, createAppointment, updateAppointment, deleteAppointment, 
  sendAppointmentConfirmation 
} from "../controllers/appointmentController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", getAppointments);
router.post("/", createAppointment);
router.patch("/:id", updateAppointment);
router.post("/:id/send-confirmation", sendAppointmentConfirmation);
router.delete("/:id", deleteAppointment);

export default router;
