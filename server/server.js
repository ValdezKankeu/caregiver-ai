import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ============================================================
   ⚡ QUICK, STRAIGHT-TO-THE-POINT CAREGIVER CHAT
============================================================ */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, clientProfile } = req.body;

    if (!message || !clientProfile) {
      return res
        .status(400)
        .json({ error: "Missing message or client profile." });
    }

    const prompt = `
You are a caregiving assistant that gives quick, no-nonsense help to home health aides.

Give only short, direct caregiving steps (2–3 lines).  
Each line should be on its own, with a blank line between them.  
Avoid introductions, empathy talk, or bullet points.  
Just say what the caregiver should do next.

Client Info:
- Name: ${clientProfile.name || "Not specified"}
- Age: ${clientProfile.age || "Not specified"}
- Special Needs: ${clientProfile.specialNeeds || "Not specified"}

The caregiver said: "${message}"

Write your response like this:
Linda has dementia.

Speak slowly and give one clear task at a time.

Keep her focused on something familiar.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You give short, clear caregiving directions. Never use paragraphs or bullets. Focus only on what the caregiver should *do* next.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 180,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No AI response.";
    res.json({ reply });
  } catch (error) {
    console.error("❌ Error in /api/chat:", error);
    res
      .status(500)
      .json({ error: "Something went wrong processing the request." });
  }
});

/* ============================================================
   💬 SIMPLE CONVERSATION / ACTIVITY STARTERS
============================================================ */
app.post("/api/conversation-starters", async (req, res) => {
  try {
    const { clientProfile } = req.body;

    if (!clientProfile) {
      return res.status(400).json({ error: "Missing client profile." });
    }

    const prompt = `
Create 5 quick, caring activity or conversation ideas related to this client’s special needs.

Client Info:
- Name: ${clientProfile.name || "the client"}
- Age: ${clientProfile.age || "not specified"}
- Special Needs: ${clientProfile.specialNeeds || "No data provided"}

Keep each idea under one short line.
Avoid introductions, bullets, or long sentences.
Make each one sound calm, caring, and relevant.

Example:
Ask Maria about her favorite quiet place.
Offer to play calm background music she enjoys.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You give short, caring activity or talk ideas for caregivers. Keep them quick, calm, and natural — never lists or paragraphs.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No AI response.";
    res.json({ reply });
  } catch (error) {
    console.error("❌ Error in /api/conversation-starters:", error);
    res.status(500).json({
      error: "Something went wrong generating conversation ideas.",
    });
  }
});

/* ============================================================
   🚀 SERVER START
============================================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
