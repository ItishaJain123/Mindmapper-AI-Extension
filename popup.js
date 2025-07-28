document.getElementById("summarize").addEventListener("click", async () => {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = '<div class="loading"><div class="loader"></div></div>';

  const summaryType = document.getElementById("summary-type").value;

  // Get API key from storage
  chrome.storage.sync.get(["geminiApiKey"], async (result) => {
    if (!result.geminiApiKey) {
      resultDiv.innerHTML =
        "API key not found. Please set your API key in the extension options.";
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_TEXT" },
        async (res) => {
          if (!res || !res.text) {
            resultDiv.innerText =
              "Could not extract article text from this page.";
            return;
          }

          try {
            const summary = await getGeminiSummary(
              res.text,
              summaryType,
              result.geminiApiKey
            );
            // resultDiv.innerText = summary;
            resultDiv.innerHTML = summary;
          } catch (error) {
            resultDiv.innerText = `Error: ${
              error.message || "Failed to generate summary."
            }`;
          }
        }
      );
    });
  });
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const summaryText = document.getElementById("result").innerText;

  if (summaryText && summaryText.trim() !== "") {
    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        const copyBtn = document.getElementById("copy-btn");
        const originalText = copyBtn.innerText;

        copyBtn.innerText = "Copied!";
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }
});

async function getGeminiSummary(text, summaryType, apiKey) {
  // Truncate very long texts to avoid API limits (typically around 30K tokens)
  const maxLength = 20000;
  const truncatedText =
    text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

  let prompt;
  switch (summaryType) {
    case "brief":
      // prompt = `Provide a brief summary of the following article in 2-3 sentences:\n\n${truncatedText}`;
      prompt = `
      Act as an expert creative writer and linguist. Your strengths are distilling complex information into elegant, clear, and concise prose.
[Instruction]
For the article I provide below, please do the following:
* Identify the author's central thesis or the single most important takeaway. This is the "core value."
* Summarize the article, ensuring that core value is the central theme of the summary.
[Specifics & Structure]
* The summary must be a single paragraph, consisting of 3 to 4 sentences.
* The tone should be authoritative and informative.
[Context for this specific article]
The purpose of this summary is formy personal research notes:\n\n${truncatedText}`;
      break;

    case "detailed":
      prompt = `Provide a detailed summary of the following article, covering all main points and key details:\n\n${truncatedText}`;
      break;

    case "bullets":
      prompt = `Summarize the following article in 5-7 key points. Format each point as a line starting with "- " (dash followed by a space). Do not use asterisks or other bullet symbols, only use the dash. Keep each point concise and focused on a single key insight from the article:\n\n${truncatedText}`;
      break;

    //     case "diagram":
    //       prompt = `
    // You are a flowchart generator.

    // Your task is to extract the key steps from the following article and represent them as a vertical flowchart using only raw HTML and inline CSS.

    // 🧠 Instructions:
    // - Use ONLY downward arrows (↓) to represent flow between steps.
    // - Use <div> blocks styled with borders, padding, and light background colors to represent each step.
    // - Steps should include: Start, Process Steps, Decisions (if any), and End.
    // - Do not use any markdown, special characters like “â†“”, or explanations. Only return clean raw HTML that can be rendered directly.
    // - Make sure each box fits its content and the overall flow is easy to follow.

    // ✅ Example Output Format:
    // <div style="border:1px solid #ccc;padding:10px;margin:10px;background:#f0f8ff;width:max-content">Start</div>
    // ↓
    // <div style="border:1px solid #ccc;padding:10px;margin:10px;background:#e0f7fa;width:max-content">Step 1: Analyze Input</div>
    // ↓
    // <div style="border:1px solid #ccc;padding:10px;margin:10px;background:#fff3e0;width:max-content">Decision: Is it Valid?</div>
    // ↓
    // <div style="border:1px solid #ccc;padding:10px;margin:10px;background:#c8e6c9;width:max-content">Yes → Continue</div>
    // ↓
    // <div style="border:1px solid #ccc;padding:10px;margin:10px;background:#ffe0e0;width:max-content">End</div>

    // 📄 Now generate a similar flowchart for this article:
    // "${truncatedText}"
    // `;
    //       break;

    case "diagram":
      prompt = `
You are a UML-style diagram generator for a Chrome Extension called "MindMapper AI".

🎯 Your task:
Convert the input article into a **vertical UML-style flowchart** using only **HTML with inline CSS**.

📌 Must-Have Requirements:
1. Use <div>
         blocks to represent each step:
   - **Rounded corners**
   - **Bold text**
   - **VIBRANT and eye-catching background colors** (no dull pastels)
   - **Slight shadow** for elevation
   - Width: max-content, centered
d
2. Use **↓** for arrows between steps:
   - Centered using <div style="text-align:center;">↓</div>
   - **No extra spacing** above or below—keep it compact and readable
   - Place **bold, dark arrows (↓)** **in the center between blocks** to show flow direction.

3. Include common UML flow:
   - Start
   - Process Steps
   - Decision Points (styled differently)
   - End

4. DO NOT include markdown, triple backticks, or explanations. Just **pure raw HTML**.

✅ Visual Style Example:
<div style="background:#4fc3f7;color:white;padding:10px 20px;border-radius:8px;box-shadow:0 1px 5px rgba(0,0,0,0.2);margin:0 auto;width:max-content;font-weight:bold;">Start</div>
<div style="text-align:center;margin:0;">↓</div>
<div style="background:#66bb6a;color:white;padding:10px 20px;border-radius:8px;box-shadow:0 1px 5px rgba(0,0,0,0.2);margin:0 auto;width:max-content;font-weight:bold;">Receive Input</div>
<div style="text-align:center;margin:0;">↓</div>
<div style="background:#ffa726;color:white;padding:10px 20px;border-radius:8px;box-shadow:0 1px 5px rgba(0,0,0,0.2);margin:0 auto;width:max-content;font-weight:bold;">Analyze Steps</div>
<div style="text-align:center;margin:0;">↓</div>
<div style="background:#ab47bc;color:white;padding:10px 20px;border-radius:8px;box-shadow:0 1px 5px rgba(0,0,0,0.2);margin:0 auto;width:max-content;font-weight:bold;">Decision: Is it valid?</div>
<div style="text-align:center;margin:0;">↓</div>
<div style="background:#ef5350;color:white;padding:10px 20px;border-radius:8px;box-shadow:0 1px 5px rgba(0,0,0,0.2);margin:0 auto;width:max-content;font-weight:bold;">End</div>

📄 Now generate a vertical, vibrant UML-style flowchart based on this article:
"${truncatedText}"
`;
      break;

    //     case "diagram":
    //       prompt = `
    // You are a UML diagram generator for a Chrome Extension called "MindMapper AI".

    // 🎯 Your task:
    // - Analyze the following article and convert its key processes into a **vertical UML-style flowchart** using clean **HTML** and **inline CSS only**.

    // 📌 Instructions:
    // 1. The flow should follow the **UML activity diagram** pattern with rectangular nodes.
    // 2. Use **ice-themed soft pastel background colors** (e.g., light blues, purples, greens).
    // 3. Place **bold, dark arrows (↓)** **in the center between blocks** to show flow direction.
    // 4. Include clear sections:
    //    - Start
    //    - Major Process Steps
    //    - Decisions (diamond-shaped or distinctly styled)
    //    - End

    // 💡 Visual Guidelines:
    // - Each step must be inside a <div> with:
    //   - padding
    //   - rounded corners
    //   - box-shadow
    //   - soft background
    //   - max-content width
    // - Vertically center arrows using a standalone <div style="text-align:center;font-weight:bold;">↓</div>.
    // - Ensure the diagram is visually **balanced, spaced**, and **easily scannable**.
    // - DO NOT use SVG, Markdown, or external libraries.
    // - Return **only raw HTML** that can be directly rendered inside an extension popup.

    // 📄 Example:
    // <div style="background:#e3f2fd;padding:12px 20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);margin:10px auto;width:max-content;">Start</div>
    // <div style="text-align:center;font-size:24px;font-weight:bold;color:#1976d2;">↓</div>
    // <div style="background:#d0f0c0;padding:12px 20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);margin:10px auto;width:max-content;">Step 1: Receive Input</div>
    // <div style="text-align:center;font-size:24px;font-weight:bold;color:#1976d2;">↓</div>
    // <div style="background:#fff3e0;padding:12px 20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);margin:10px auto;width:max-content;">Decision: Is Input Valid?</div>
    // <div style="text-align:center;font-size:24px;font-weight:bold;color:#1976d2;">↓</div>
    // <div style="background:#fce4ec;padding:12px 20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);margin:10px auto;width:max-content;">Yes → Proceed</div>
    // <div style="text-align:center;font-size:24px;font-weight:bold;color:#1976d2;">↓</div>
    // <div style="background:#e1bee7;padding:12px 20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);margin:10px auto;width:max-content;">End</div>

    // 📚 Now generate a similar vertical UML-style flowchart based on this article or text:
    // "${truncatedText}"
    // `;
    //       break;

    default:
      prompt = `Summarize the following article:\n\n${truncatedText}`;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const data = await res.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No summary available."
    );
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate summary. Please try again later.");
  }
}

// TEXT-TO-SPEECH HANDLER
const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");
const responseBox = document.getElementById("result");
let utterance = null;

playBtn?.addEventListener("click", () => {
  const text = responseBox?.innerText?.trim();
  if (!text) return alert("Nothing to speak!");

  speechSynthesis.cancel();

  utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.pitch = 1;
  utterance.rate = 1;

  speechSynthesis.speak(utterance);
});

pauseBtn?.addEventListener("click", () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.pause();
  } else if (speechSynthesis.paused) {
    speechSynthesis.resume();
  }
});
