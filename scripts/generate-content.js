import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import 'dotenv/config';
import axios from 'axios';

const API_KEY_PATH = path.resolve(process.cwd(), "apikey.txt");
const PEXELS_API_KEY_PATH = path.resolve(process.cwd(), "pexels_apikey.txt");
const KEYWORD_PATH = path.resolve(process.cwd(), "keyword.txt");
const OUTPUT_PATH = path.resolve(process.cwd(), "public", "articles.json");

const BACKDATE_DAYS = parseInt(process.env.BACKDATE_DAYS) || 3;
const FUTURE_SCHEDULE_DAYS = parseInt(process.env.FUTURE_SCHEDULE_DAYS) || 30;
const REQUEST_DELAY_MS = 5000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getAnalysisPrompt = (keyword) => `
  Analyze the user keyword: "${keyword}".
  Your task is to act as an award-winning content strategist and return a single, valid JSON object.
  Your goal is to find a UNIQUE ANGLE to make the resulting article stand out from the thousands of other articles on this topic.
  
  Return a JSON object with these exact keys:
  - "suggestedTitle": A highly creative, curiosity-driven, SEO-friendly title that reflects the unique angle. Avoid generic titles.
  - "primaryCategory": The single most relevant high-level category (e.g., "Technology", "Travel", "Health").
  - "categorySlug": A URL-friendly version of the primaryCategory.
  - "persona": The ideal author persona for this specific angle (e.g., "A skeptical tech reviewer", "A seasoned world traveler sharing secrets").
  - "uniqueAngle": A one-sentence summary of the specific, non-obvious viewpoint this article will take. For example, instead of just "Benefits of Meditation", the angle could be "Focusing on how meditation can specifically improve financial decision-making".
  - "hookIntro": A short, compelling opening paragraph (2-3 sentences) to grab the reader's attention, based on the unique angle. This will be used to start the article.
`;

const getContentPrompt = (keyword, analysis, date) => `
  Act as: "${analysis.persona}".
  Your mission is to write a high-quality, thought-provoking article based on a very specific creative brief.

  **Creative Brief:**
  - **Main Title:** "${analysis.suggestedTitle}"
  - **Unique Viewpoint:** You MUST write the entire article from this angle: "${analysis.uniqueAngle}". Do NOT write a generic overview.
  - **Opening Hook:** Start the article's summary section IMMEDIATELY with this paragraph: "${analysis.hookIntro}"

  **Mandatory Rules for Uniqueness:**
  1.  **Use Analogies:** Throughout the "deepDive" and "importance" sections, you must use at least two unique analogies or metaphors to explain complex points.
  2.  **Avoid Clichés:** Do not use overused phrases. Be original in your expression.
  3.  **Actionable Insights:** Ensure your points are not just theoretical but provide clear, actionable advice that is not commonly found elsewhere.
  4.  **Confident Tone:** Write with authority and conviction, guided by your persona.

  **Output Format:**
  Return a single, valid JSON object with the exact keys: "slug", "term", "date", "category", "categorySlug", "tags", "isPopular", "summary", "deepDive", "importance", an array of "prosCons", and an array of "faq".
  
  **Content Details:**
  - The "summary" MUST start with the "Opening Hook" provided in the brief.
  - The "deepDive" and "importance" values MUST be in valid Markdown format with their own creative "##" headings. Their combined word count must exceed 1000 words.
  - "slug": A URL-friendly version of the term "${keyword}".
  - "term": Must be exactly "${analysis.suggestedTitle}".
  - "date": Must be exactly "${date}".
  - "category": Must be exactly "${analysis.primaryCategory}".
  - "categorySlug": Must be exactly "${analysis.categorySlug}".
  - "tags": An array of 3-5 relevant lowercase strings.
  - "isPopular": A boolean value.
`;

const getUniquenessPrompt = (text, persona) => `
  Act as a master editor with the persona of "${persona}".
  Your single most important task is to rewrite the following text to make it 100% unique and pass plagiarism checks.

  **Mandatory Rules:**
  1.  **Preserve Core Meaning:** The key facts and intended message MUST be preserved.
  2.  **Radically Alter Sentence Structures:** Do not reuse sentence structures from the original. If the original starts with the subject, you start with a clause or phrase. Vary sentence length dramatically.
  3.  **Aggressively Replace Vocabulary:** Substitute generic nouns, verbs, and adjectives with more vivid, specific, and less common synonyms, while staying true to the persona.
  4.  **Re-order Concepts:** If a paragraph presents ideas in the order A, B, C, try reordering them to C, A, B, if it still makes logical sense.
  5.  **Maintain Persona:** The final text must sound natural for the given persona.

  **Original Text to Rewrite:**
  ---
  ${text}
  ---

  **Your 100% Unique Rewrite:**
`;

const getInternalLinkingPrompt = (articleText, allArticleTitles) => `
  You are an SEO expert specializing in internal linking.
  Your task is to strategically insert 3-5 internal links into the provided article text.
  You MUST only link to titles from the provided list.

  **RULES:**
  1.  **Relevance is Key:** Only insert a link if it is highly relevant to the sentence or paragraph.
  2.  **Natural Placement:** The links must feel natural to the reader, not forced.
  3.  **Use Markdown Format:** The link format must be \`[anchor text](/{slug})\`.
  4.  **Do Not Change Content:** Do not add or remove sentences. Only wrap existing text with link markdown.
  5.  **Return Only the Modified Text:** Your entire output should only be the full article text with the links inserted. Do not add any explanation.

  **List of Available Article Titles to Link To (Title, /slug):**
  ---
  ${allArticleTitles.map(a => `- ${a.term}, /${a.slug}`).join('\n')}
  ---

  **Original Article Text:**
  ---
  ${articleText}
  ---

  **Article Text with Internal Links:**
`;

const getExternalLinkingPrompt = (articleText) => `
  You are a fact-checker and editor. Your task is to add 2-3 high-authority external links to the provided article text to increase its credibility.

  **RULES:**
  1.  **High Authority Sources Only:** Link ONLY to well-respected, authoritative sources (e.g., Wikipedia, major news publications like Forbes or Reuters, government websites, university studies, industry-leading blogs). Do NOT link to competitors or low-quality sites.
  2.  **Support Claims:** Find specific claims, statistics, or facts in the text and link them to a source that backs up that specific claim.
  3.  **Use Markdown Format:** The link format must be \`[anchor text](https://example.com/source)\`.
  4.  **Do Not Change Content:** Only wrap existing text with link markdown.
  5.  **Return Only the Modified Text:** Your entire output should only be the full article text with the external links inserted.

  **Original Article Text:**
  ---
  ${articleText}
  ---

  **Article Text with External Links:**
`;

async function uniquenessBooster(text, persona, models, apiKeyIndex) {
  if (!text) return "";
  console.log(`   -> Applying Uniqueness Booster...`);
  try {
    const prompt = getUniquenessPrompt(text, persona);
    const result = await generateWithFallback(prompt, models, apiKeyIndex);
    return result.response.text();
  } catch (error) {
    console.warn(`   -> WARN: Uniqueness Booster failed. Returning original text. Error: ${error.message}`);
    return text;
  }
}

async function fetchImageFromPexels(keyword, pexelsApiKey) {
  if (!pexelsApiKey) {
    console.warn("   -> WARN: Pexels API key not found. Skipping image search.");
    return null;
  }
  try {
    console.log(` -> Searching for image with keyword: "${keyword}"`);
    const response = await axios.get(`https://api.pexels.com/v1/search`, {
      headers: { Authorization: pexelsApiKey },
      params: { query: keyword, per_page: 1, orientation: 'landscape' }
    });
    if (response.data.photos && response.data.photos.length > 0) {
      const imageUrl = response.data.photos[0].src.large;
      console.log(`   -> Image found: ${imageUrl}`);
      return imageUrl;
    } else {
      console.warn(`   -> WARN: No image found on Pexels for "${keyword}".`);
      return null;
    }
  } catch (error) {
    console.error(`   -> ERROR: Failed to fetch image from Pexels. ${error.message}`);
    return null;
  }
}

async function generateWithFallback(prompt, models, startIndex = 0) {
  const totalModels = models.length;
  for (let i = 0; i < totalModels; i++) {
    const currentIndex = (startIndex + i) % totalModels;
    const model = models[currentIndex];
    try {
      console.log(`   -> Attempting with API key index: ${currentIndex}`);
      const result = await model.generateContent(prompt);
      return result;
    } catch (e) {
      console.warn(`   -> WARN: API key at index ${currentIndex} failed. Error: ${e.message.substring(0, 100)}...`);
      if (i < totalModels - 1) {
        console.warn(`   -> Retrying task with the next key...`);
      }
    }
  }
  throw new Error("All available API keys failed for this specific task.");
}

async function main() {
  console.log("Starting Universal Content Generation Process...");
  try {
    const outputDir = path.dirname(OUTPUT_PATH);
    await fs.mkdir(outputDir, { recursive: true });
    const rawApiKeyContent = await fs.readFile(API_KEY_PATH, "utf-8");
    const apiKeys = rawApiKeyContent.split('\n').filter(key => key.trim().startsWith("AIzaSy"));
    if (!apiKeys.length) throw new Error("Could not find any valid API Keys in apikey.txt.");
    let pexelsApiKey = null;
    try {
      pexelsApiKey = (await fs.readFile(PEXELS_API_KEY_PATH, "utf-8")).trim();
    } catch(e) {
      console.warn("WARN: pexels_apikey.txt not found. Image generation will be skipped.");
    }
    const models = apiKeys.map(key => new GoogleGenerativeAI(key).getGenerativeModel({ model: "gemini-1.5-flash" }));
    console.log(`Found ${models.length} valid API keys.`);
    const keywords = (await fs.readFile(KEYWORD_PATH, "utf-8")).trim().split('\n').filter(k => k.trim());
    if (!keywords.length) {
      console.log("No keywords found. Exiting.");
      return;
    }
    let allArticles = [];
    try {
      allArticles = JSON.parse(await fs.readFile(OUTPUT_PATH, "utf-8"));
    } catch (e) {}
    const createSlug = (text = '') => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const existingSlugs = new Set(allArticles.map(article => article.slug));
    const keywordsToGenerate = keywords.filter(keyword => !existingSlugs.has(createSlug(keyword)));

    if (keywordsToGenerate.length > 0) {
      console.log(`${allArticles.length} articles exist. Found ${keywordsToGenerate.length} new keywords to generate.`);
      const totalScheduleSpan = BACKDATE_DAYS + FUTURE_SCHEDULE_DAYS;
      const postsPerDay = Math.ceil(keywords.length / totalScheduleSpan);
      let keywordCount = allArticles.length;
      let currentApiKeyIndex = 0;

      for (let i = 0; i < keywordsToGenerate.length; i++) {
        const keyword = keywordsToGenerate[i];
        keywordCount++;
        const currentKeyword = keyword.trim();
        console.log(`\n[${i + 1}/${keywordsToGenerate.length}] Processing keyword: "${currentKeyword}"`);
        try {
          console.log(" -> Step 1: Devising a unique content strategy...");
          const analysisPrompt = getAnalysisPrompt(currentKeyword);
          const analysisResult = await generateWithFallback(analysisPrompt, models, currentApiKeyIndex);
          let analysisText = analysisResult.response.text();
          let cleanedAnalysisText = analysisText.match(/{[\s\S]*}/)[0];
          const analysis = JSON.parse(cleanedAnalysisText);
          console.log(` -> Unique Angle: "${analysis.uniqueAngle}"`);
          
          console.log(" -> Step 2: Writing first draft based on the creative brief...");
          const daySlot = Math.floor((keywordCount - 1) / postsPerDay);
          const dayOffset = daySlot - (BACKDATE_DAYS > 0 ? BACKDATE_DAYS - 1 : 0);
          const publishDate = new Date();
          publishDate.setDate(publishDate.getDate() + dayOffset);
          const formattedDate = publishDate.toISOString().split('T')[0];
          
          const contentPrompt = getContentPrompt(currentKeyword, analysis, formattedDate);
          const contentResult = await generateWithFallback(contentPrompt, models, currentApiKeyIndex);
          const contentText = contentResult.response.text();
          
          const jsonMatch = contentText.match(/{[\s\S]*}/);
          if (!jsonMatch) throw new Error("No valid JSON block found in the AI response.");
          
          const jsonString = jsonMatch[0];
          let jsonResult = JSON.parse(jsonString);
          console.log(` -> SUCCESS: First draft for "${currentKeyword}" generated.`);

          console.log(" -> Step 3: Applying Uniqueness Booster...");
          let uniqueDeepDive = await uniquenessBooster(jsonResult.deepDive, analysis.persona, models, currentApiKeyIndex);
          let uniqueImportance = await uniquenessBooster(jsonResult.importance, analysis.persona, models, currentApiKeyIndex);

          const existingTitlesForLinking = allArticles.map(a => ({ term: a.term, slug: a.slug }));
          
          let combinedTextForLinking = `${uniqueDeepDive}\n\n${uniqueImportance}`;
          
          if (existingTitlesForLinking.length > 0) {
            console.log(" -> Step 4: Adding internal links...");
            const internalLinkPrompt = getInternalLinkingPrompt(combinedTextForLinking, existingTitlesForLinking);
            combinedTextForLinking = (await generateWithFallback(internalLinkPrompt, models, currentApiKeyIndex)).response.text();
          }

          console.log(" -> Step 5: Adding external links...");
          const externalLinkPrompt = getExternalLinkingPrompt(combinedTextForLinking);
          const finalText = (await generateWithFallback(externalLinkPrompt, models, currentApiKeyIndex)).response.text();
          
          jsonResult.deepDive = finalText;
          jsonResult.importance = "";

          const imageUrl = await fetchImageFromPexels(currentKeyword, pexelsApiKey);
          jsonResult.imageUrl = imageUrl;
          if (imageUrl) {
            console.log(`   -> SUCCESS: Image added for "${currentKeyword}".`);
          }
          allArticles.push(jsonResult);
          console.log(` -> SUCCESS: Final, fully linked article for "${currentKeyword}" is complete.`);
        } catch (e) {
          console.error(` -> FAILED: Skipping keyword "${currentKeyword}" after trying all API keys. Error: ${e.message}`);
        }
        currentApiKeyIndex = (currentApiKeyIndex + 1) % models.length;
        if (i < keywordsToGenerate.length - 1) {
            await delay(REQUEST_DELAY_MS);
        }
      }
    } else {
      console.log("All keywords already have articles. No new content to generate.");
    }

    console.log("\n--- Starting Image Update Process for Existing Articles ---");
    let updatedImageCount = 0;
    for (const article of allArticles) {
      if (!article.hasOwnProperty('imageUrl')) {
        console.log(`\nUpdating image for: "${article.term}"`);
        const imageUrl = await fetchImageFromPexels(article.term, pexelsApiKey);
        article.imageUrl = imageUrl;
        if (imageUrl) {
          console.log(`   -> SUCCESS: Image added for "${article.term}".`);
          updatedImageCount++;
        }
        await delay(REQUEST_DELAY_MS); 
      }
    }
    if (updatedImageCount > 0) {
      console.log(`\n--- Image Update Complete. Added images to ${updatedImageCount} articles. ---`);
    } else {
      console.log("\n--- No existing articles needed an image update. ---");
    }

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(allArticles, null, 2));
    console.log(`\nProcess finished. Total articles now: ${allArticles.length}.`);
  } catch (error) {
    console.error("An unrecoverable error occurred during the process:", error);
    process.exit(1);
  }
}

main();