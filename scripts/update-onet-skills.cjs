#!/usr/bin/env node
/**
 * O*NET Skills Database Updater
 *
 * Downloads and processes the O*NET database to extract a comprehensive
 * list of skills for the resume builder autocomplete.
 *
 * O*NET releases updates quarterly (March, June, September, December).
 * Recommended update frequency: Monthly (to catch new releases promptly)
 *
 * Usage:
 *   node scripts/update-onet-skills.js
 *
 * This script:
 * 1. Downloads the latest O*NET database (text format)
 * 2. Extracts skills, abilities, knowledge, and work activities
 * 3. Generates a deduplicated, sorted JSON file for the frontend
 * 4. Updates the metadata with last update timestamp
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// O*NET Database Configuration
const ONET_VERSION = "29_1"; // Update this when new versions release
const ONET_DOWNLOAD_URL = `https://www.onetcenter.org/dl_files/database/db_${ONET_VERSION}_text.zip`;
const TEMP_DIR = path.join(__dirname, "../.onet-temp");
const OUTPUT_FILE = path.join(__dirname, "../src/data/onet-skills.json");

// Files to extract from O*NET database - comprehensive list including equipment
const ONET_FILES = {
  skills: { file: "Skills.txt", priority: 1 }, // Core skills like "Critical Thinking"
  abilities: { file: "Abilities.txt", priority: 1 }, // Cognitive/physical abilities
  knowledge: { file: "Knowledge.txt", priority: 1 }, // Knowledge areas
  workActivities: { file: "Work Activities.txt", priority: 1 }, // Work activities
  technologySkills: { file: "Technology Skills.txt", priority: 2 }, // Software/tech skills
  tools: { file: "Tools Used.txt", priority: 3 }, // Equipment and tools - also valid skills!
};

// Industry categories based on O*NET occupation families and common sectors
const INDUSTRY_CATEGORIES = {
  "Core Skills": {
    keywords: [],
    description: "Fundamental skills applicable across all industries",
  },
  "Technology & IT": {
    keywords: [
      "software",
      "computer",
      "programming",
      "database",
      "network",
      "server",
      "web",
      "cloud",
      "cyber",
      "data",
      "digital",
      "code",
      "developer",
      "API",
      "system admin",
      "IT ",
      "tech support",
      "hardware",
      "virtualization",
      "machine learning",
      "artificial intelligence",
      "AI ",
      "blockchain",
    ],
    description: "Information technology, software development, and computing",
  },
  "Healthcare & Medical": {
    keywords: [
      "medical",
      "health",
      "patient",
      "clinical",
      "hospital",
      "nursing",
      "surgical",
      "diagnostic",
      "therapy",
      "pharmaceutical",
      "dental",
      "laboratory",
      "anatomy",
      "physician",
      "radiology",
      "MRI",
      "CT scan",
      "ultrasound",
      "EKG",
      "stethoscope",
      "syringe",
      "IV ",
      "catheter",
      "ventilator",
      "defibrillator",
      "blood pressure",
      "oxygen",
      "wheelchair",
      "prosthetic",
      "orthopedic",
      "ophthalmol",
      "cardio",
      "neuro",
      "oncology",
      "pediatric",
      "obstetric",
      "anesthesi",
      "phlebotom",
      "CPR",
      "first aid",
    ],
    description: "Healthcare, medicine, nursing, and medical technology",
  },
  "Finance & Accounting": {
    keywords: [
      "accounting",
      "financial",
      "banking",
      "tax",
      "audit",
      "budget",
      "investment",
      "insurance",
      "payroll",
      "bookkeeping",
      "ledger",
      "invoice",
      "billing",
      "credit",
      "loan",
      "mortgage",
      "securities",
      "trading",
      "portfolio",
      "actuarial",
      "fiscal",
      "monetary",
      "treasury",
    ],
    description: "Finance, banking, accounting, and insurance",
  },
  "Manufacturing & Production": {
    keywords: [
      "manufacturing",
      "production",
      "assembly",
      "factory",
      "industrial",
      "machine",
      "CNC",
      "lathe",
      "mill",
      "weld",
      "fabricat",
      "quality control",
      "lean",
      "six sigma",
      "conveyor",
      "forklift",
      "warehouse",
      "inventory",
      "supply chain",
      "logistics",
      "shipping",
      "packaging",
      "injection mold",
      "stamping",
      "pressing",
      "grinding",
      "cutting",
      "drilling",
    ],
    description: "Manufacturing, production, and industrial operations",
  },
  "Construction & Trades": {
    keywords: [
      "construction",
      "building",
      "carpentry",
      "plumbing",
      "electrical",
      "HVAC",
      "masonry",
      "roofing",
      "concrete",
      "scaffold",
      "crane",
      "excavat",
      "blueprint",
      "architect",
      "surveying",
      "demolition",
      "insulation",
      "drywall",
      "flooring",
      "tile",
      "paint",
      "hammer",
      "drill",
      "saw",
      "wrench",
      "level",
      "tape measure",
      "nail gun",
      "soldering",
    ],
    description: "Construction, skilled trades, and building",
  },
  "Sales & Marketing": {
    keywords: [
      "sales",
      "marketing",
      "advertising",
      "brand",
      "customer",
      "CRM",
      "lead",
      "prospect",
      "pitch",
      "negotiat",
      "retail",
      "merchandis",
      "promotion",
      "campaign",
      "SEO",
      "social media",
      "content",
      "copywriting",
      "market research",
      "consumer",
      "e-commerce",
      "point of sale",
      "POS",
    ],
    description: "Sales, marketing, advertising, and customer relations",
  },
  "Education & Training": {
    keywords: [
      "teaching",
      "education",
      "curriculum",
      "instruction",
      "classroom",
      "student",
      "learning",
      "training",
      "tutoring",
      "lesson",
      "academic",
      "school",
      "university",
      "college",
      "professor",
      "teacher",
      "coach",
      "mentor",
      "e-learning",
      "LMS",
      "assessment",
      "grading",
    ],
    description: "Education, training, and academic instruction",
  },
  "Legal & Compliance": {
    keywords: [
      "legal",
      "law",
      "attorney",
      "paralegal",
      "contract",
      "litigation",
      "compliance",
      "regulatory",
      "court",
      "judicial",
      "mediation",
      "arbitration",
      "intellectual property",
      "patent",
      "trademark",
      "copyright",
      "HIPAA",
      "GDPR",
      "SOX",
      "audit",
    ],
    description: "Legal services, compliance, and regulatory affairs",
  },
  "Creative & Design": {
    keywords: [
      "design",
      "creative",
      "graphic",
      "visual",
      "art",
      "photo",
      "video",
      "animation",
      "illustrat",
      "typography",
      "layout",
      "color",
      "Adobe",
      "Photoshop",
      "Illustrator",
      "InDesign",
      "Figma",
      "Sketch",
      "CAD",
      "3D model",
      "render",
      "UX",
      "UI",
      "brand",
      "logo",
    ],
    description: "Design, creative arts, and visual media",
  },
  "Hospitality & Food Service": {
    keywords: [
      "hospitality",
      "hotel",
      "restaurant",
      "food service",
      "culinary",
      "chef",
      "cook",
      "baking",
      "catering",
      "bartend",
      "server",
      "front desk",
      "concierge",
      "housekeeping",
      "tourism",
      "travel",
      "event",
      "banquet",
      "oven",
      "grill",
      "fryer",
      "refrigerat",
    ],
    description: "Hospitality, food service, and tourism",
  },
  "Transportation & Logistics": {
    keywords: [
      "transport",
      "logistics",
      "shipping",
      "freight",
      "trucking",
      "delivery",
      "driving",
      "CDL",
      "fleet",
      "dispatch",
      "route",
      "cargo",
      "customs",
      "import",
      "export",
      "aviation",
      "pilot",
      "aircraft",
      "maritime",
      "rail",
      "GPS",
      "tracking",
    ],
    description: "Transportation, logistics, and supply chain",
  },
  "Agriculture & Environment": {
    keywords: [
      "agricult",
      "farm",
      "crop",
      "livestock",
      "harvest",
      "irrigation",
      "tractor",
      "seed",
      "fertiliz",
      "pesticide",
      "organic",
      "horticulture",
      "forestry",
      "conservation",
      "environment",
      "ecology",
      "wildlife",
      "sustainab",
      "renewable",
      "solar",
      "wind energy",
      "recycl",
    ],
    description: "Agriculture, environmental science, and sustainability",
  },
  "Science & Research": {
    keywords: [
      "research",
      "laboratory",
      "scientific",
      "experiment",
      "analysis",
      "chemistry",
      "biology",
      "physics",
      "microscope",
      "specimen",
      "hypothesis",
      "peer review",
      "publication",
      "clinical trial",
      "R&D",
      "biotech",
      "genetics",
      "molecular",
    ],
    description: "Scientific research and laboratory work",
  },
  "Human Resources": {
    keywords: [
      "human resources",
      "HR ",
      "recruiting",
      "hiring",
      "onboarding",
      "employee",
      "benefits",
      "compensation",
      "performance review",
      "talent",
      "workforce",
      "HRIS",
      "payroll",
      "labor relations",
      "diversity",
      "inclusion",
    ],
    description: "Human resources and talent management",
  },
  "Administrative & Office": {
    keywords: [
      "administrative",
      "office",
      "clerical",
      "secretary",
      "receptionist",
      "filing",
      "scheduling",
      "calendar",
      "correspondence",
      "data entry",
      "typing",
      "Microsoft Office",
      "Excel",
      "Word",
      "PowerPoint",
      "Outlook",
      "copier",
      "fax",
      "scanner",
      "printer",
    ],
    description: "Administrative support and office management",
  },
  "Security & Public Safety": {
    keywords: [
      "security",
      "safety",
      "guard",
      "surveillance",
      "emergency",
      "fire",
      "police",
      "law enforcement",
      "investigat",
      "patrol",
      "alarm",
      "access control",
      "CCTV",
      "first responder",
      "rescue",
      "hazmat",
      "protective",
    ],
    description: "Security, law enforcement, and public safety",
  },
};

// Core skills that apply to all industries (from O*NET's basic skills)
const UNIVERSAL_SKILLS = [
  "Active Learning",
  "Active Listening",
  "Critical Thinking",
  "Learning Strategies",
  "Mathematics",
  "Monitoring",
  "Reading Comprehension",
  "Science",
  "Speaking",
  "Writing",
  "Complex Problem Solving",
  "Coordination",
  "Instructing",
  "Judgment and Decision Making",
  "Management of Financial Resources",
  "Management of Material Resources",
  "Management of Personnel Resources",
  "Negotiation",
  "Persuasion",
  "Programming",
  "Quality Control Analysis",
  "Service Orientation",
  "Social Perceptiveness",
  "Systems Analysis",
  "Systems Evaluation",
  "Technology Design",
  "Time Management",
  "Troubleshooting",
  "Equipment Maintenance",
  "Equipment Selection",
  "Installation",
  "Operation and Control",
  "Operation Monitoring",
  "Operations Analysis",
  "Repairing",
];

/**
 * Download a file from URL
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading from ${url}...`);

    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirect
          downloadFile(response.headers.location, destPath)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers["content-length"], 10);
        let downloadedSize = 0;

        response.on("data", (chunk) => {
          downloadedSize += chunk.length;
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(
            `\r   Progress: ${percent}% (${(
              downloadedSize /
              1024 /
              1024
            ).toFixed(1)} MB)`
          );
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log("\n   ✅ Download complete");
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {}); // Delete partial file
        reject(err);
      });
  });
}

/**
 * Parse O*NET tab-separated file and extract unique element names
 */
function parseOnetFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️ File not found: ${path.basename(filePath)}`);
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // Get header to find the element name column
  const header = lines[0].split("\t");
  const nameIndex = header.findIndex(
    (h) =>
      h.includes("Element Name") ||
      h.includes("Title") ||
      h.includes("Commodity Title") ||
      h.includes("T2 Example")
  );

  if (nameIndex === -1) {
    console.log(
      `   ⚠️ Could not find name column in ${path.basename(filePath)}`
    );
    console.log(`   Headers: ${header.slice(0, 5).join(", ")}...`);
    return [];
  }

  const items = new Set();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    if (cols[nameIndex]) {
      const name = cols[nameIndex].trim();
      if (name && name.length > 1 && name.length < 100) {
        items.add(name);
      }
    }
  }

  return Array.from(items);
}

/**
 * Clean and normalize skill names
 */
function cleanSkillName(name) {
  return name
    .replace(/\s+/g, " ")
    .replace(/^\d+\.\s*/, "") // Remove leading numbers
    .trim();
}

/**
 * Categorize a skill into an industry based on keywords
 */
function categorizeSkill(skillName) {
  const lowerSkill = skillName.toLowerCase();

  // Check if it's a universal/core skill first
  if (UNIVERSAL_SKILLS.some((s) => s.toLowerCase() === lowerSkill)) {
    return "Core Skills";
  }

  // Check each industry's keywords
  for (const [industry, config] of Object.entries(INDUSTRY_CATEGORIES)) {
    if (industry === "Core Skills") continue; // Already checked

    for (const keyword of config.keywords) {
      if (lowerSkill.includes(keyword.toLowerCase())) {
        return industry;
      }
    }
  }

  // Default to "General" if no match
  return "General";
}

/**
 * Main update process
 */
async function updateSkillsDatabase() {
  console.log("🔄 O*NET Skills Database Updater");
  console.log("================================\n");

  try {
    // Create temp directory
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Create output directory
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const zipPath = path.join(TEMP_DIR, "onet-db.zip");

    // Download O*NET database
    await downloadFile(ONET_DOWNLOAD_URL, zipPath);

    // Extract zip file
    console.log("\n📦 Extracting database...");
    execSync(`unzip -o "${zipPath}" -d "${TEMP_DIR}"`, { stdio: "pipe" });
    console.log("   ✅ Extraction complete\n");

    // Find the extracted folder (usually named like db_29_1)
    const extractedFolders = fs
      .readdirSync(TEMP_DIR)
      .filter((f) => fs.statSync(path.join(TEMP_DIR, f)).isDirectory());
    const dbFolder = extractedFolders[0];
    const dbPath = path.join(TEMP_DIR, dbFolder);

    console.log(`📂 Processing database: ${dbFolder}\n`);

    // Collect all skills from different sources
    const allSkills = new Map(); // Use Map to track source

    // Process each O*NET file
    for (const [category, config] of Object.entries(ONET_FILES)) {
      const filePath = path.join(dbPath, config.file);
      console.log(`   Processing ${category}...`);

      const items = parseOnetFile(filePath);
      items.forEach((item) => {
        const cleaned = cleanSkillName(item);
        if (cleaned && !allSkills.has(cleaned.toLowerCase())) {
          allSkills.set(cleaned.toLowerCase(), {
            name: cleaned,
            category: category,
          });
        }
      });

      console.log(`   ✅ Found ${items.length} unique items in ${category}`);
    }

    // Convert to array and sort
    const skillsList = Array.from(allSkills.values())
      .map((s) => s.name)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    // Categorize skills by industry
    console.log("\n📊 Categorizing skills by industry...");
    const skillsByIndustry = {};

    // Initialize all categories
    for (const industry of Object.keys(INDUSTRY_CATEGORIES)) {
      skillsByIndustry[industry] = [];
    }
    skillsByIndustry["General"] = []; // For uncategorized skills

    // Categorize each skill
    for (const skill of skillsList) {
      const industry = categorizeSkill(skill);
      skillsByIndustry[industry].push(skill);
    }

    // Sort skills within each category
    for (const industry of Object.keys(skillsByIndustry)) {
      skillsByIndustry[industry].sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
    }

    // Print category counts
    console.log("   Industry breakdown:");
    for (const [industry, skills] of Object.entries(skillsByIndustry)) {
      if (skills.length > 0) {
        console.log(
          `   • ${industry}: ${skills.length.toLocaleString()} skills`
        );
      }
    }

    // Create output JSON with metadata
    const output = {
      version: ONET_VERSION.replace("_", "."),
      lastUpdated: new Date().toISOString(),
      source: "O*NET Resource Center (www.onetcenter.org)",
      license: "O*NET data is public domain and freely available",
      totalCount: skillsList.length,
      skills: skillsList, // Flat list for backward compatibility
      byIndustry: skillsByIndustry, // Organized by industry
      industries: Object.keys(INDUSTRY_CATEGORIES)
        .concat(["General"])
        .filter((ind) => skillsByIndustry[ind]?.length > 0),
    };

    // Write output file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

    console.log(`\n✅ Successfully generated skills database!`);
    console.log(`   📁 Output: ${OUTPUT_FILE}`);
    console.log(`   📊 Total skills: ${skillsList.length.toLocaleString()}`);
    console.log(
      `   📦 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`
    );

    // Cleanup temp files
    console.log("\n🧹 Cleaning up temporary files...");
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    console.log("   ✅ Cleanup complete\n");

    // Show sample of skills
    console.log("📋 Sample skills (first 20):");
    skillsList.slice(0, 20).forEach((s) => console.log(`   • ${s}`));

    return output;
  } catch (error) {
    console.error("\n❌ Error updating skills database:", error.message);

    // Cleanup on error
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    process.exit(1);
  }
}

// Run the update
updateSkillsDatabase().then((result) => {
  console.log("\n🎉 Update complete!");
  console.log(
    `   Next recommended update: ${new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString()}`
  );
});
