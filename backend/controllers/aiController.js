const Groq = require('groq-sdk');

function isHarmful(text) {
  if (!text) return false;
  const lowered = text.toLowerCase();
  const banned = [
    'hate', 'racist', 'sexist', 'violence', 'kill', 'murder', 'self-harm', 'suicide',
    'terrorism', 'extremism', 'porn', 'sexual content', 'exploit', 'abuse'
  ];
  return banned.some((w) => lowered.includes(w));
}

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

const systemPrompt = `You are Taskvra's AI assistant. Answer freelancing-related questions clearly and helpfully.
- If a user asks for harmful, hateful, racist, sexist, lewd, or violent content, reply exactly: "Sorry, I can't assist with that."
- Be concise and practical. Provide links only if generally known resources. Avoid personal data.
- You can cover topics like finding gigs, crafting proposals, pricing, contracts, client communication, time management, taxes basics, portfolio building, tools, and marketplaces.`;

const chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'messages array is required' });
    }

    // Basic harmful content check
    const lastUser = messages.filter((m) => m.role === 'user').pop();
    if (lastUser && isHarmful(lastUser.content || '')) {
      return res.json({ reply: "Sorry, I can't assist with that." });
    }

    const client = getClient();
    if (!client) {
      return res.status(501).json({ message: 'AI not configured. Set GROQ_API_KEY in backend .env.' });
    }

    // Trim long histories
    const trimmed = messages.slice(-10);
    const model = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...trimmed.map((m) => ({ role: m.role, content: String(m.content || '').slice(0, 4000) }))
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const reply = completion.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ message: 'AI service error' });
  }
};

module.exports = { chat };
