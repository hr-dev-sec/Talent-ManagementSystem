import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { encryptText, decryptText, calculateHash } from "./crypto";
import {
  ArrowLeft,
  MoreVertical,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Download,
  MapPin,
  Building2,
  History,
  Brain,
  Calendar,
  BarChart3,
  GraduationCap,
  BookOpen,
  LayoutGrid,
  Users,
  User,
  Settings,
  Search,
  Sliders,
  Sparkles,
  Printer,
  X,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  Keyboard,
  Command,
  Zap,
  Compass,
  Edit2,
  Send,
  UserPlus,
  Clock,
  Award,
  UserCheck,
  Grid3X3,
  Lock,
  Unlock,
  ShieldAlert,
  Key,
  Mail,
  Tag,
  Upload,
  Moon,
  Sun,
  Move,
  Save,
  UserCog,
  Cloud,
  RefreshCw,
  RotateCcw,
  Target,
  TrendingDown,
  AlertTriangle,
  Camera,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  SlidersHorizontal,
  Database
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { MOCK_TALENTS } from "./data";
import {
  TalentProfile,
  RetiringPosition,
  PotentialAssessment,
  PerformanceEvaluation,
  SavedFilter,
  TrainingItem,
  DeleteConfirmModalConfig,
  SupabaseNoticeModalConfig
} from "./types";
import {
  FEMALE_AVATARS,
  MALE_AVATARS,
  detectGenderFromName,
  getSyncedAvatarUrl,
  compressImageFile
} from "./utils/avatarUtils";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getSupabaseClient,
  pushToSupabase,
  pullFromSupabase
} from "./supabaseClient";

const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction * 120,
    scale: 0.98,
    filter: "blur(4px)"
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      mass: 0.8
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: -direction * 120,
    scale: 0.98,
    filter: "blur(4px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      mass: 0.8
    }
  })
};

const getCellName = (perf: "Low" | "Medium" | "High", pot: "Low" | "Medium" | "High") => {
  if (pot === "High") {
    if (perf === "Low") return "Enigma (Box 4)";
    if (perf === "Medium") return "High Potential (Box 7)";
    return "Star Leader (Box 9)";
  }
  if (pot === "Medium") {
    if (perf === "Low") return "Inconsistent Performer (Box 2)";
    if (perf === "Medium") return "Core Contributor (Box 5)";
    return "High Performer (Box 8)";
  }
  if (perf === "Low") return "Underperformer (Box 1)";
  if (perf === "Medium") return "Solid Performer (Box 3)";
  return "Workhorse / Specialist (Box 6)";
};

const getPlacementRecommendation = (perf: "Low" | "Medium" | "High", pot: "Low" | "Medium" | "High") => {
  if (pot === "High") {
    if (perf === "Low") return "Bimbingan kinerja intensif untuk mengeksplorasi hambatan dan mengoptimalkan potensi kepemimpinan tinggi.";
    if (perf === "Medium") return "Berikan tanggung jawab proyek lintas divisi dan mentoring kepemimpinan tingkat lanjut untuk persiapan promosi.";
    return "Kandidat prioritas utama untuk suksesi kepemimpinan langsung (Ready Now). Berikan pelatihan eksekutif.";
  }
  if (pot === "Medium") {
    if (perf === "Low") return "Evaluasi ulang kesesuaian peran saat ini dan berikan pelatihan teknis terfokus.";
    if (perf === "Medium") return "Pertahankan performa stabil dengan program pengayaan tugas (job enrichment).";
    return "Pertimbangkan untuk jalur spesialis senior atau penugasan strategis skala menengah.";
  }
  if (perf === "Low") return "Diperlukan Rencana Peningkatan Kinerja (PIP) terstruktur dan monitoring ketat.";
  if (perf === "Medium") return "Fokus pada stabilisasi hasil kerja harian dan tingkatkan motivasi kerja.";
  return "Manfaatkan keahlian teknis secara maksimal untuk operasional harian dan mentoring staf junior.";
};

export default function App() {
  // Appearance / Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Authentication & View states
  const [authState, setAuthState] = useState<"landing" | "login" | "authenticated">("landing");
  const [userRole, setUserRole] = useState<"admin" | "user">("admin");
  const [loginEmail, setLoginEmail] = useState("admin@ajinomoto.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Navigation states
  const [activeTab, setActiveTabRaw] = useState<"home" | "talent-pool" | "profile" | "settings" | "nine-box">("profile");
  const [direction, setDirection] = useState<number>(1);

  const setActiveTab = (newTab: "home" | "talent-pool" | "profile" | "settings" | "nine-box") => {
    const tabOrder: ("home" | "talent-pool" | "nine-box" | "profile" | "settings")[] = [
      "home",
      "talent-pool",
      "nine-box",
      "profile",
      "settings"
    ];
    const currentIdx = tabOrder.indexOf(activeTab);
    const nextIdx = tabOrder.indexOf(newTab);
    if (currentIdx !== -1 && nextIdx !== -1 && nextIdx !== currentIdx) {
      setDirection(nextIdx > currentIdx ? 1 : -1);
    }
    setActiveTabRaw(newTab);
  };

  const [dashboardSubTab, setDashboardSubTab] = useState<"analytics" | "retirement">("analytics");
  const [managerialTarget, setManagerialTarget] = useState<number>(4.0);

  // Default Initial Retiring Positions
  const DEFAULT_RETIRING_POSITIONS: RetiringPosition[] = [
    {
      id: "pos-dm-fi",
      positionName: "Department Manager Food Ingredients-1",
      currentIncumbent: "SUWITO",
      retirementDate: "Maret 2027 (9 Bulan)",
      division: "Food Ingredients-1 (A-MJK)",
      urgency: "High",
      targetCompetencies: ["Leadership", "Problem Solving"],
      assignedSuccessorId: "edwin-prasetyo",
      suitabilityStatus: "Primary"
    },
    {
      id: "pos-dm-hse",
      positionName: "Department Manager Health Safety & Environment",
      currentIncumbent: "REZA GILANG MAHARDIKA",
      retirementDate: "November 2026 (4 Bulan)",
      division: "Health Safety & Environtment Dept (A-MJK)",
      urgency: "High",
      targetCompetencies: ["Interpersonal Skill", "Problem Solving"],
      assignedSuccessorId: "muhammad-kholidin",
      suitabilityStatus: "Primary"
    },
    {
      id: "pos-dm-foe",
      positionName: "Department Manager Factory Operational Excellence",
      currentIncumbent: "DIDIK SULISTIYO",
      retirementDate: "Agustus 2027 (13 Bulan)",
      division: "Factory Operational Excellence  (A-MJK) Dept",
      urgency: "Medium",
      targetCompetencies: ["Business Knowledge", "Leadership"],
      assignedSuccessorId: "nawang-purma",
      suitabilityStatus: "Primary"
    },
    {
      id: "pos-dm-procurement",
      positionName: "Department Manager Procurement & EXIM",
      currentIncumbent: "FININAWATI DWI WAHYUDI",
      retirementDate: "Desember 2027 (17 Bulan)",
      division: "Procurement & EXIM (A-MJK)",
      urgency: "Medium",
      targetCompetencies: ["Interpersonal Skill", "Problem Solving"],
      assignedSuccessorId: "moch-ari",
      suitabilityStatus: "Primary"
    },
    {
      id: "pos-sm-ppc",
      positionName: "Section Manager Production Planning & Control",
      currentIncumbent: "AGIL SETIAWAN",
      retirementDate: "Juni 2028 (2 Tahun)",
      division: "Production Planning & Control (A-MJK)",
      urgency: "Low",
      targetCompetencies: ["Business Knowledge", "Leadership"],
      assignedSuccessorId: "lutfia-anggraini",
      suitabilityStatus: "Primary"
    }
  ];

  // Talent management states with Local Database Persistence
  const [talents, setTalents] = useState<TalentProfile[]>(() => {
    try {
      const saved = localStorage.getItem("talent_database_records");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Gagal membaca database talenta dari localStorage", e);
    }
    return MOCK_TALENTS;
  });

  const [selectedTalentId, setSelectedTalentId] = useState<string>("edwin-prasetyo");
  const [previewTalentId, setPreviewTalentId] = useState<string>("edwin-prasetyo");

  // Retiring positions succession planning state with Local Database Persistence
  const [retiringPositions, setRetiringPositions] = useState<RetiringPosition[]>(() => {
    try {
      const saved = localStorage.getItem("retiring_positions_records");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Gagal membaca data posisi pensiun dari localStorage", e);
    }
    return DEFAULT_RETIRING_POSITIONS;
  });

  // Sync talents to local database system
  React.useEffect(() => {
    try {
      localStorage.setItem("talent_database_records", JSON.stringify(talents));
    } catch (e) {
      console.error("Gagal menyimpan database talenta ke localStorage", e);
    }
  }, [talents]);

  // Sync retiring positions to local database system
  React.useEffect(() => {
    try {
      localStorage.setItem("retiring_positions_records", JSON.stringify(retiringPositions));
    } catch (e) {
      console.error("Gagal menyimpan data posisi pensiun ke localStorage", e);
    }
  }, [retiringPositions]);

  const [isAddRetiringPositionOpen, setIsAddRetiringPositionOpen] = useState(false);
  const retiringImportInputRef = React.useRef<HTMLInputElement>(null);

  // Active Succession Candidates filters
  const [activeCandidateSearch, setActiveCandidateSearch] = useState<string>("");
  const [activeCandidateDivisionFilter, setActiveCandidateDivisionFilter] = useState<string>("All");
  const [activeCandidateReadinessFilter, setActiveCandidateReadinessFilter] = useState<string>("All");

  // Skill Gap Heatmap filters
  const [heatmapSearch, setHeatmapSearch] = useState<string>("");
  const [heatmapDeptFilter, setHeatmapDeptFilter] = useState<string>("All");
  const [heatmapGapFilter, setHeatmapGapFilter] = useState<string>("All");

  // Retiring positions succession filters
  const [retiringPosSearch, setRetiringPosSearch] = useState<string>("");
  const [retiringPosUrgencyFilter, setRetiringPosUrgencyFilter] = useState<string>("All");
  const [retiringPosStatusFilter, setRetiringPosStatusFilter] = useState<string>("All");

  // Candidate matcher filters
  const [candidateSearch, setCandidateSearch] = useState<string>("");
  const [candidateReadinessFilter, setCandidateReadinessFilter] = useState<string>("All");
  const [candidateMatchFilter, setCandidateMatchFilter] = useState<string>("All");

  // Succession Pipeline Alignment table filters
  const [successionPipelineSearch, setSuccessionPipelineSearch] = useState<string>("");
  const [successionPipelineUrgencyFilter, setSuccessionPipelineUrgencyFilter] = useState<string>("All");
  const [selectedRetiringPositionId, setSelectedRetiringPositionId] = useState<string | null>(null);

  // Candidate Readiness search
  const [readinessSearch, setReadinessSearch] = useState<string>("");

  const ensurePotentialAssessment = (talent: TalentProfile): PotentialAssessment => {
    if (talent.potentialAssessment) return talent.potentialAssessment;
    return {
      kemampuanIntelektual: 3,
      berpikirKritis: 3,
      menyelesaikanMasalah: 2,
      belajarCepat: 3,
      kesadaranDiri: 2,
      interpersonal: 2,
      kecerdasanEmosional: 2,
      motivasiKomitmen: 3,
      businessKnowledge: 4,
      leadership: 3,
      problemSolving: 3,
      interpersonalSkill: 3,
      strategicMindset: 3,
      managesComplexity: 3,
      ensuresAccountability: 3,
      drivesVision: 3,
      cultivateInnovation: 2,
      studyBackgroundName: "S2 Manajemen Bisnis",
      studyBackgroundScore: 3,
      targetLevel: "DM"
    };
  };

  const calculateTalentPotentialDetails = (talent: TalentProfile) => {
    const assessment = ensurePotentialAssessment(talent);

    // 1. Psychological Test (40%)
    const sumPsych =
      (assessment.kemampuanIntelektual || 0) +
      (assessment.berpikirKritis || 0) +
      (assessment.menyelesaikanMasalah || 0) +
      (assessment.belajarCepat || 0) +
      (assessment.kesadaranDiri || 0) +
      (assessment.interpersonal || 0) +
      (assessment.kecerdasanEmosional || 0) +
      (assessment.motivasiKomitmen || 0);
    const psychRatio = sumPsych / 24;
    const psychWeighted = psychRatio * 40;

    // 2. Competency (50%)
    const sumComp =
      (assessment.businessKnowledge || 0) +
      (assessment.leadership || 0) +
      (assessment.problemSolving || 0) +
      (assessment.interpersonalSkill || 0) +
      (assessment.strategicMindset || 0) +
      (assessment.managesComplexity || 0) +
      (assessment.ensuresAccountability || 0) +
      (assessment.drivesVision || 0) +
      (assessment.cultivateInnovation || 0);

    const divisor = assessment.targetLevel === "SM" ? 2 : 3;
    const compMax = divisor * 9;
    const compRatio = sumComp / compMax;
    const compWeighted = compRatio * 50;

    // 3. Study Background (10%)
    const bgStandard = 4.0;
    const bgRatio = (assessment.studyBackgroundScore || 0) / bgStandard;
    const bgWeighted = bgRatio * 10;

    let rawPotentialScore = Math.min(psychWeighted + compWeighted + bgWeighted, 100);
    let totalPotentialScore = rawPotentialScore;

    if (talent.customPotential === "Low") {
      totalPotentialScore = Math.round(20 + (rawPotentialScore / 100) * 28);
    } else if (talent.customPotential === "Medium") {
      totalPotentialScore = Math.round(50 + (rawPotentialScore / 100) * 24);
    } else if (talent.customPotential === "High") {
      totalPotentialScore = Math.round(76 + (rawPotentialScore / 100) * 22);
    }

    return {
      sumPsych,
      psychRatio,
      psychWeighted,
      sumComp,
      compMax,
      compRatio,
      compWeighted,
      bgRatio,
      bgWeighted,
      bgStandard,
      totalPotentialScore,
      assessment
    };
  };

  const calculateTalentPerformanceDetails = (talent: TalentProfile) => {
    let score50 = 31.25;
    let isFromImport = false;
    let is0To50Scale = false;
    let avgRawScore = 0;

    const evalScores = ["2020", "2021", "2022", "2023", "2024"].map(
      (yr) => talent.performanceEvaluation?.[`fy${yr}`]
    );
    const nonZeroScores = evalScores.filter((s): s is number => typeof s === "number" && !isNaN(s) && s > 0);

    if (nonZeroScores.length > 0) {
      const maxVal = Math.max(...nonZeroScores);
      avgRawScore = nonZeroScores.reduce((a, b) => a + b, 0) / nonZeroScores.length;

      if (maxVal > 5.0) {
        is0To50Scale = true;
        score50 = avgRawScore;
      } else {
        is0To50Scale = false;
        score50 = 12.5 + ((avgRawScore - 1.0) / 4.0) * 37.5;
      }
    } else if (talent.importedEvaluasiScore !== undefined && talent.importedEvaluasiScore > 0) {
      isFromImport = true;
      score50 = talent.importedEvaluasiScore > 50 ? (talent.importedEvaluasiScore / 100) * 50 : talent.importedEvaluasiScore;
      avgRawScore = score50;
      is0To50Scale = score50 > 5.0;
    }

    score50 = Math.min(Math.max(score50, 12.5), 50.0);
    const percentage = (score50 / 50.0) * 100;

    let perfLevel: "Low" | "Medium" | "High" = "Medium";

    if (talent.customPerformance) {
      perfLevel = talent.customPerformance;
    } else if (talent.importedEvaluasiCategory) {
      const cat = talent.importedEvaluasiCategory.toLowerCase();
      if (cat.includes("tinggi") || cat.includes("high") || cat === "3") perfLevel = "High";
      else if (cat.includes("rendah") || cat.includes("low") || cat === "1") perfLevel = "Low";
      else perfLevel = "Medium";
    } else {
      if (score50 < 25.0) perfLevel = "Low";
      else if (score50 < 37.5) perfLevel = "Medium";
      else perfLevel = "High";
    }

    const code = perfLevel === "Low" ? 1 : perfLevel === "Medium" ? 2 : 3;
    const categoryName = perfLevel === "Low" ? "Rendah" : perfLevel === "Medium" ? "Sedang" : "Tinggi";

    return {
      score50,
      percentage,
      perfLevel,
      categoryName,
      code,
      isFromImport,
      avgRawScore,
      is0To50Scale
    };
  };

  const getTalentPerformanceScore = (talent: TalentProfile) => {
    const { score50 } = calculateTalentPerformanceDetails(talent);
    return Number(score50.toFixed(2));
  };

  const getTalentCoordinates = (talent: TalentProfile) => {
    const { totalPotentialScore } = calculateTalentPotentialDetails(talent);
    let xVal = (totalPotentialScore / 100) * 1.333333;

    if (talent.customPotential === "Low") {
      xVal = Math.min(0.43, Math.max(0.05, xVal));
    } else if (talent.customPotential === "Medium") {
      xVal = Math.min(0.87, Math.max(0.45, xVal));
    } else if (talent.customPotential === "High") {
      xVal = Math.min(1.30, Math.max(0.90, xVal));
    }

    const details = calculateTalentPerformanceDetails(talent);
    let yVal = details.score50;

    if (talent.customPerformance === "Low") {
      yVal = Math.min(24.8, Math.max(12.7, yVal));
    } else if (talent.customPerformance === "Medium") {
      yVal = Math.min(37.3, Math.max(25.2, yVal));
    } else if (talent.customPerformance === "High") {
      yVal = Math.min(49.8, Math.max(37.7, yVal));
    }

    return {
      x: Math.min(Math.max(xVal, 0.00), 1.333333),
      y: Math.min(Math.max(yVal, 12.5), 50.0)
    };
  };

  const getTalentPlacement = (talent: TalentProfile): { performance: "Low" | "Medium" | "High"; potential: "Low" | "Medium" | "High" } => {
    const coords = getTalentCoordinates(talent);
    let potential: "Low" | "Medium" | "High" = "Medium";
    if (talent.customPotential) {
      potential = talent.customPotential;
    } else {
      if (coords.x <= 0.44444444) potential = "Low";
      else if (coords.x <= 0.88888888) potential = "Medium";
      else potential = "High";
    }

    let performance: "Low" | "Medium" | "High" = "Medium";
    if (talent.customPerformance) {
      performance = talent.customPerformance;
    } else {
      const details = calculateTalentPerformanceDetails(talent);
      performance = details.perfLevel;
    }

    return { performance, potential };
  };

  const handleUpdateReadiness = (talentId: string, newReadiness: string) => {
    const getReadinessColor = (ready: string): "emerald" | "amber" | "rose" | "teal" => {
      if (ready === "READY NOW") return "emerald";
      if (ready === "READY 1-2 YEARS") return "amber";
      if (ready === "READY 2+ YEARS") return "rose";
      return "teal";
    };

    setTalents((prev) =>
      prev.map((t) => {
        if (t.id === talentId) {
          return {
            ...t,
            readiness: newReadiness,
            readinessColor: getReadinessColor(newReadiness)
          };
        }
        return t;
      })
    );
  };

  const currentTalent = talents.find((t) => t.id === selectedTalentId) || talents[0];
  const readyNowCount = talents.filter((t) => t.readiness === "READY NOW").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-primary/10">
      {/* Header Bar */}
      <header className="w-full bg-white/90 dark:bg-slate-900 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png"
            className="h-8 object-contain"
            alt="Logo"
          />
          <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
            <span className="font-display text-sm font-black text-primary dark:text-teal-400 block leading-none">
              AJINOMOTO INDONESIA
            </span>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block mt-1">
              Succession Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setAuthState("landing")}
            className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-sm"
          >
            Kembali ke Beranda
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black font-display text-slate-900 dark:text-slate-100">
              {currentTalent.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {currentTalent.title} • {currentTalent.division}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border ${
                currentTalent.readinessColor === "emerald"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {currentTalent.readiness}
            </span>
          </div>
        </div>

        {/* Global Readiness Calibration Panel */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider">
                Kalibrasi Tingkat Kesiapan Talent (Global Readiness Calibration)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah status kesiapan suksesi kandidat secara langsung di bawah ini.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau jabatan..."
                value={readinessSearch}
                onChange={(e) => setReadinessSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {talents
              .filter(
                (t) =>
                  !readinessSearch.trim() ||
                  t.name.toLowerCase().includes(readinessSearch.toLowerCase()) ||
                  t.title.toLowerCase().includes(readinessSearch.toLowerCase())
              )
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={t.avatar}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      alt={t.name}
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                        {t.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        {t.title} ({t.division})
                      </span>
                    </div>
                  </div>

                  <select
                    value={t.readiness}
                    onChange={(e) => handleUpdateReadiness(t.id, e.target.value)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="READY NOW">READY NOW</option>
                    <option value="READY 1-2 YEARS">READY 1-2 YEARS</option>
                    <option value="READY 2+ YEARS">READY 2+ YEARS</option>
                  </select>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { encryptText, decryptText, calculateHash } from "./crypto";
import {
  ArrowLeft,
  MoreVertical,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Download,
  MapPin,
  Building2,
  History,
  Brain,
  Calendar,
  BarChart3,
  GraduationCap,
  BookOpen,
  LayoutGrid,
  Users,
  User,
  Settings,
  Search,
  Sliders,
  Sparkles,
  Printer,
  X,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  Keyboard,
  Command,
  Zap,
  Compass,
  Edit2,
  Send,
  UserPlus,
  Clock,
  Award,
  UserCheck,
  Grid3X3,
  Lock,
  Unlock,
  ShieldAlert,
  Key,
  Mail,
  Tag,
  Upload,
  Moon,
  Sun,
  Move,
  Save,
  UserCog,
  Cloud,
  RefreshCw,
  RotateCcw,
  Target,
  TrendingDown,
  AlertTriangle,
  Camera,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  SlidersHorizontal
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { MOCK_TALENTS } from "./data";
import { TalentProfile, RetiringPosition, PotentialAssessment, PerformanceEvaluation, SavedFilter, TrainingItem, DeleteConfirmModalConfig, SupabaseNoticeModalConfig } from "./types";
import { FEMALE_AVATARS, MALE_AVATARS, detectGenderFromName, getSyncedAvatarUrl, compressImageFile } from "./utils/avatarUtils";
import { Database } from "lucide-react";
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  getSupabaseClient, 
  pushToSupabase, 
  pullFromSupabase 
} from "./supabaseClient";


const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction * 120,
    scale: 0.98,
    filter: "blur(4px)"
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      mass: 0.8
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: -direction * 120,
    scale: 0.98,
    filter: "blur(4px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      mass: 0.8
    }
  })
};

const getCellName = (perf: "Low" | "Medium" | "High", pot: "Low" | "Medium" | "High") => {
  if (pot === "High") {
    if (perf === "Low") return "Enigma (Box 4)";
    if (perf === "Medium") return "High Potential (Box 7)";
    return "Star Leader (Box 9)";
  }
  if (pot === "Medium") {
    if (perf === "Low") return "Inconsistent Performer (Box 2)";
    if (perf === "Medium") return "Core Contributor (Box 5)";
    return "High Performer (Box 8)";
  }
  if (perf === "Low") return "Underperformer (Box 1)";
  if (perf === "Medium") return "Solid Performer (Box 3)";
  return "Workhorse / Specialist (Box 6)";
};

const getPlacementRecommendation = (perf: "Low" | "Medium" | "High", pot: "Low" | "Medium" | "High") => {
  if (pot === "High") {
    if (perf === "Low") return "Bimbingan kinerja intensif untuk mengeksplorasi hambatan dan mengoptimalkan potensi kepemimpinan tinggi.";
    if (perf === "Medium") return "Berikan tanggung jawab proyek lintas divisi dan mentoring kepemimpinan tingkat lanjut untuk persiapan promosi.";
    return "Kandidat prioritas utama untuk suksesi kepemimpinan langsung (Ready Now). Berikan pelatihan eksekutif.";
  }
  if (pot === "Medium") {
    if (perf === "Low") return "Evaluasi ulang kesesuaian peran saat ini dan berikan pelatihan teknis terfokus.";
    if (perf === "Medium") return "Pertahankan performa stabil dengan program pengayaan tugas (job enrichment).";
    return "Pertimbangkan untuk jalur spesialis senior atau penugasan strategis skala menengah.";
  }
  if (perf === "Low") return "Diperlukan Rencana Peningkatan Kinerja (PIP) terstruktur dan monitoring ketat.";
  if (perf === "Medium") return "Fokus pada stabilisasi hasil kerja harian dan tingkatkan motivasi kerja.";
  return "Manfaatkan keahlian teknis secara maksimal untuk operasional harian dan mentoring staf junior.";
};

export default function App() {
  // Appearance / Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Authentication & View states
  const [authState, setAuthState] = useState<"landing" | "login" | "authenticated">("landing");
  const [userRole, setUserRole] = useState<"admin" | "user">("admin");
  const [loginEmail, setLoginEmail] = useState("admin@ajinomoto.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Navigation states
  const [activeTab, setActiveTabRaw] = useState<"home" | "talent-pool" | "profile" | "settings" | "nine-box">("profile");
  const [direction, setDirection] = useState<number>(1);

  const setActiveTab = (newTab: "home" | "talent-pool" | "profile" | "settings" | "nine-box") => {
    const tabOrder: ("home" | "talent-pool" | "nine-box" | "profile" | "settings")[] = ["home", "talent-pool", "nine-box", "profile", "settings"];
    const currentIdx = tabOrder.indexOf(activeTab);
    const nextIdx = tabOrder.indexOf(newTab);
    if (currentIdx !== -1 && nextIdx !== -1 && nextIdx !== currentIdx) {
      setDirection(nextIdx > currentIdx ? 1 : -1);
    }
    setActiveTabRaw(newTab);
  };
  const [dashboardSubTab, setDashboardSubTab] = useState<"analytics" | "retirement">("analytics");
  const [managerialTarget, setManagerialTarget] = useState<number>(4.0);
  
  // Default Initial Retiring Positions
  const DEFAULT_RETIRING_POSITIONS: RetiringPosition[] = [
    {
      id: "pos-dm-fi",
      positionName: "Department Manager Food Ingredients-1",
      currentIncumbent: "SUWITO",
      retirementDate: "Maret 2027 (9 Bulan)",
      division: "Food Ingredients-1 (A-MJK)",
      urgency: "High",
      targetCompetencies: ["Leadership", "Problem Solving"],
      assignedSuccessorId: "edwin-prasetyo",
      suitabilityStatus: "Primary"
    },
    {
      id: "pos-dm-hse",
      positionName: "Department Manager Health Safety & Environment",
      currentIncumbent: "REZA GILANG MAHARDIKA",
      retirementDate: "November 2026 (4 Bulan)",
      division: "Health Safety & Environtment Dept (A-MJK)",
      urgency: "High",
      targetCompetencies: ["Interpersonal Skill", "Problem Solving"],
      assignedSuccessorId: "muhammad-kholidin",
      suitabilityStatus: "Primary"
    },
    {
      id: "pos-dm-foe",
      positionName: "Department Manager Factory Operational Excellence",
      currentIncumbent: "DIDIK SULISTIYO",
      retirementDate: "Agustus 2027 (13 Bulan)",
      division: "Factory Operational Excellence  (A-MJK) Dept",
      urgency: "Medium",
      targetCompetencies: ["Business Knowledge", "Leadership"],
      assignedSuccessorId: "nawang-purma",
      suitabilityStatus: "Primary"
    },
    {
      id: "pos-dm-procurement",
      positionName: "Department Manager Procurement & EXIM",
      currentIncumbent: "FININAWATI DWI WAHYUDI",
      retirementDate: "Desember 2027 (17 Bulan)",
      division: "Procurement & EXIM (A-MJK)",
      urgency: "Medium",
      targetCompetencies: ["Interpersonal Skill", "Problem Solving"],
      assignedSuccessorId: "moch-ari",
      suitabilityStatus: "Primary"
    },
    {
      id: "pos-sm-ppc",
      positionName: "Section Manager Production Planning & Control",
      currentIncumbent: "AGIL SETIAWAN",
      retirementDate: "Juni 2028 (2 Tahun)",
      division: "Production Planning & Control (A-MJK)",
      urgency: "Low",
      targetCompetencies: ["Business Knowledge", "Leadership"],
      assignedSuccessorId: "lutfia-anggraini",
      suitabilityStatus: "Primary"
    }
  ];

  // Talent management states with Local Database Persistence
  const [talents, setTalents] = useState<TalentProfile[]>(() => {
    try {
      const saved = localStorage.getItem("talent_database_records");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Gagal membaca database talenta dari localStorage", e);
    }
    return MOCK_TALENTS;
  });

  const [selectedTalentId, setSelectedTalentId] = useState<string>("edwin-prasetyo");
  const [previewTalentId, setPreviewTalentId] = useState<string>("edwin-prasetyo");

  // Retiring positions succession planning state with Local Database Persistence
  const [retiringPositions, setRetiringPositions] = useState<RetiringPosition[]>(() => {
    try {
      const saved = localStorage.getItem("retiring_positions_records");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Gagal membaca data posisi pensiun dari localStorage", e);
    }
    return DEFAULT_RETIRING_POSITIONS;
  });

  // Sync talents to local database system
  React.useEffect(() => {
    try {
      localStorage.setItem("talent_database_records", JSON.stringify(talents));
    } catch (e) {
      console.error("Gagal menyimpan database talenta ke localStorage", e);
    }
  }, [talents]);

  // Sync retiring positions to local database system
  React.useEffect(() => {
    try {
      localStorage.setItem("retiring_positions_records", JSON.stringify(retiringPositions));
    } catch (e) {
      console.error("Gagal menyimpan data posisi pensiun ke localStorage", e);
    }
  }, [retiringPositions]);

  const [isAddRetiringPositionOpen, setIsAddRetiringPositionOpen] = useState(false);
  const retiringImportInputRef = React.useRef<HTMLInputElement>(null);
  
  // Active Succession Candidates filters
  const [activeCandidateSearch, setActiveCandidateSearch] = useState<string>("");
  const [activeCandidateDivisionFilter, setActiveCandidateDivisionFilter] = useState<string>("All");
  const [activeCandidateReadinessFilter, setActiveCandidateReadinessFilter] = useState<string>("All");

  // Skill Gap Heatmap filters
  const [heatmapSearch, setHeatmapSearch] = useState<string>("");
  const [heatmapDeptFilter, setHeatmapDeptFilter] = useState<string>("All");
  const [heatmapGapFilter, setHeatmapGapFilter] = useState<string>("All");

  // Retiring positions succession filters
  const [retiringPosSearch, setRetiringPosSearch] = useState<string>("");
  const [retiringPosUrgencyFilter, setRetiringPosUrgencyFilter] = useState<string>("All");
  const [retiringPosStatusFilter, setRetiringPosStatusFilter] = useState<string>("All");

  // Candidate matcher filters
  const [candidateSearch, setCandidateSearch] = useState<string>("");
  const [candidateReadinessFilter, setCandidateReadinessFilter] = useState<string>("All");
  const [candidateMatchFilter, setCandidateMatchFilter] = useState<string>("All");

  // Succession Pipeline Alignment table filters
  const [successionPipelineSearch, setSuccessionPipelineSearch] = useState<string>("");
  const [successionPipelineUrgencyFilter, setSuccessionPipelineUrgencyFilter] = useState<string>("All");
  const [selectedRetiringPositionId, setSelectedRetiringPositionId] = useState<string | null>(null);
  
  const [newRetiringPos, setNewRetiringPos] = useState({
    positionName: "",
    currentIncumbent: "",
    retirementDate: "",
    division: "Technology Dept.",
    urgency: "Medium" as "High" | "Medium" | "Low",
    targetCompetency1: "Leadership",
    targetCompetency2: "Problem Solving"
  });

  const handleAddRetiringPosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRetiringPos.positionName || !newRetiringPos.currentIncumbent || !newRetiringPos.retirementDate) return;

    const id = "pos-" + newRetiringPos.positionName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

    const createdPos: RetiringPosition = {
      id,
      positionName: newRetiringPos.positionName,
      currentIncumbent: newRetiringPos.currentIncumbent,
      retirementDate: newRetiringPos.retirementDate,
      division: newRetiringPos.division,
      urgency: newRetiringPos.urgency,
      targetCompetencies: [newRetiringPos.targetCompetency1, newRetiringPos.targetCompetency2],
    };

    setRetiringPositions(prev => [...prev, createdPos]);
    setIsAddRetiringPositionOpen(false);
    
    // Reset form
    setNewRetiringPos({
      positionName: "",
      currentIncumbent: "",
      retirementDate: "",
      division: "Technology Div.",
      urgency: "Medium",
      targetCompetency1: "Leadership",
      targetCompetency2: "Problem Solving"
    });
  };

  const calculateMatchScore = (talent: TalentProfile, pos: RetiringPosition) => {
    let score = 0;

    // 1. Division Match (max 30 points)
    const isDivisionMatch = talent.division.toLowerCase().includes(pos.division.toLowerCase()) || 
                            pos.division.toLowerCase().includes(talent.division.toLowerCase());
    if (isDivisionMatch) {
      score += 30;
    } else {
      score += 10;
    }

    // 2. Readiness Level Match (max 30 points)
    if (talent.readiness === "READY NOW") {
      score += 30;
    } else if (talent.readiness === "READY 1-2 YEARS") {
      score += 20;
    } else if (talent.readiness === "READY 2+ YEARS") {
      score += 10;
    }

    // 3. Competencies Scores Match (max 40 points)
    let compSum = 0;
    let compCount = 0;
    
    pos.targetCompetencies.forEach(targetCompName => {
      const compObj = talent.competencies.find(c => c.name.toLowerCase() === targetCompName.toLowerCase());
      if (compObj) {
        compSum += compObj.score;
        compCount++;
      } else {
        if (targetCompName.toLowerCase().includes("leadership") && talent.psychometric.leadershipPotential) {
          compSum += talent.psychometric.leadershipPotential.score;
          compCount++;
        } else if (targetCompName.toLowerCase().includes("logical") && talent.psychometric.logicalReasoning) {
          compSum += talent.psychometric.logicalReasoning.score;
          compCount++;
        } else {
          compSum += 75;
          compCount++;
        }
      }
    });

    const compAverage = compCount > 0 ? (compSum / compCount) : 75;
    score += Math.round((compAverage / 100) * 40);

    return Math.min(score, 100);
  };

  const ensurePotentialAssessment = (talent: TalentProfile): PotentialAssessment => {
    if (talent.potentialAssessment) return talent.potentialAssessment;
    return {
      kemampuanIntelektual: 3,
      berpikirKritis: 3,
      menyelesaikanMasalah: 2,
      belajarCepat: 3,
      kesadaranDiri: 2,
      interpersonal: 2,
      kecerdasanEmosional: 2,
      motivasiKomitmen: 3,
      businessKnowledge: 4,
      leadership: 3,
      problemSolving: 3,
      interpersonalSkill: 3,
      strategicMindset: 3,
      managesComplexity: 3,
      ensuresAccountability: 3,
      drivesVision: 3,
      cultivateInnovation: 2,
      studyBackgroundName: "S2 Manajemen Bisnis",
      studyBackgroundScore: 3,
      targetLevel: "DM"
    };
  };

  const calculateTalentPotentialDetails = (talent: TalentProfile) => {
    const assessment = ensurePotentialAssessment(talent);
    
    // 1. Psychological Test (40%) - Standard Base: 24 points (8 items * 3), Max: 32 points
    const sumPsych = 
      (assessment.kemampuanIntelektual || 0) +
      (assessment.berpikirKritis || 0) +
      (assessment.menyelesaikanMasalah || 0) +
      (assessment.belajarCepat || 0) +
      (assessment.kesadaranDiri || 0) +
      (assessment.interpersonal || 0) +
      (assessment.kecerdasanEmosional || 0) +
      (assessment.motivasiKomitmen || 0);
    const psychRatio = sumPsych / 24;
    const psychWeighted = psychRatio * 40; // max 53.3%
    
    // 2. Competency (50%) - Standard: 18 (SM, 2*9) or 27 (DM, 3*9), Max: 45
    const sumComp = 
      (assessment.businessKnowledge || 0) +
      (assessment.leadership || 0) +
      (assessment.problemSolving || 0) +
      (assessment.interpersonalSkill || 0) +
      (assessment.strategicMindset || 0) +
      (assessment.managesComplexity || 0) +
      (assessment.ensuresAccountability || 0) +
      (assessment.drivesVision || 0) +
      (assessment.cultivateInnovation || 0);
    
    const divisor = assessment.targetLevel === "SM" ? 2 : 3;
    const compMax = divisor * 9;
    const compRatio = sumComp / compMax;
    const compWeighted = compRatio * 50; // max 83.3%
    
    // 3. Study Background (10%) - Standard Base: 4.0 (S1 level)
    const bgStandard = 4.0;
    const bgRatio = (assessment.studyBackgroundScore || 0) / bgStandard;
    const bgWeighted = bgRatio * 10; // max 12.5%
    
    // Total Integrated Potential Score (%)
    let rawPotentialScore = Math.min(psychWeighted + compWeighted + bgWeighted, 100);
    let totalPotentialScore = rawPotentialScore;
    
    // Sync with Nine-Box potential override while preserving candidate-level metric variation
    if (talent.customPotential === "Low") {
      totalPotentialScore = Math.round(20 + (rawPotentialScore / 100) * 28);
    } else if (talent.customPotential === "Medium") {
      totalPotentialScore = Math.round(50 + (rawPotentialScore / 100) * 24);
    } else if (talent.customPotential === "High") {
      totalPotentialScore = Math.round(76 + (rawPotentialScore / 100) * 22);
    }
    
    return {
      sumPsych,
      psychRatio,
      psychWeighted,
      sumComp,
      compMax,
      compRatio,
      compWeighted,
      bgRatio,
      bgWeighted,
      bgStandard,
      totalPotentialScore,
      assessment
    };
  };

  const calculateTalentPerformanceDetails = (talent: TalentProfile): {
    score50: number;
    percentage: number;
    perfLevel: "Low" | "Medium" | "High";
    categoryName: string;
    code: number;
    isFromImport: boolean;
    avgRawScore: number;
    is0To50Scale: boolean;
  } => {
    // 1. Raw Evaluasi Sumbu Y Score (scale 12.5 - 50.0)
    let score50 = 31.25;
    let isFromImport = false;
    let is0To50Scale = false;
    let avgRawScore = 0;

    const evalScores = evaluationYears.map(yr => talent.performanceEvaluation?.[`fy${yr}`]);
    const nonZeroScores = evalScores.filter((s): s is number => typeof s === "number" && !isNaN(s) && s > 0);

    if (nonZeroScores.length > 0) {
      const maxVal = Math.max(...nonZeroScores);
      avgRawScore = nonZeroScores.reduce((a, b) => a + b, 0) / nonZeroScores.length;

      if (maxVal > 5.0) {
        is0To50Scale = true;
        score50 = avgRawScore;
      } else {
        is0To50Scale = false;
        score50 = 12.5 + ((avgRawScore - 1.0) / 4.0) * 37.5;
      }
    } else if (talent.importedEvaluasiScore !== undefined && talent.importedEvaluasiScore > 0) {
      isFromImport = true;
      score50 = talent.importedEvaluasiScore > 50 ? (talent.importedEvaluasiScore / 100) * 50 : talent.importedEvaluasiScore;
      avgRawScore = score50;
      is0To50Scale = score50 > 5.0;
    }

    score50 = Math.min(Math.max(score50, 12.5), 50.0);
    const percentage = (score50 / 50.0) * 100;

    // 2. Performance Category & Code
    let perfLevel: "Low" | "Medium" | "High" = "Medium";

    if (talent.customPerformance) {
      perfLevel = talent.customPerformance;
    } else if (talent.importedEvaluasiCategory) {
      const cat = talent.importedEvaluasiCategory.toLowerCase();
      if (cat.includes("tinggi") || cat.includes("high") || cat === "3" || cat === "3.00") perfLevel = "High";
      else if (cat.includes("rendah") || cat.includes("low") || cat === "1" || cat === "1.00") perfLevel = "Low";
      else perfLevel = "Medium";
    } else {
      if (score50 < 25.0) perfLevel = "Low";
      else if (score50 < 37.5) perfLevel = "Medium";
      else perfLevel = "High";
    }

    const code = perfLevel === "Low" ? 1 : perfLevel === "Medium" ? 2 : 3;
    const categoryName = perfLevel === "Low" ? "Rendah" : perfLevel === "Medium" ? "Sedang" : "Tinggi";

    return {
      score50,
      percentage,
      perfLevel,
      categoryName,
      code,
      isFromImport,
      avgRawScore,
      is0To50Scale
    };
  };

  const getTalentPerformanceScore = (talent: TalentProfile) => {
    const { score50 } = calculateTalentPerformanceDetails(talent);
    return Number(score50.toFixed(2));
  };

  const getTalentCoordinates = (talent: TalentProfile) => {
    // 1. Sumbu X (Potential): 0.00 to 1.33 (SM Standard Scale)
    const { totalPotentialScore } = calculateTalentPotentialDetails(talent);
    let xVal = (totalPotentialScore / 100) * 1.333333;

    if (talent.customPotential === "Low") {
      xVal = Math.min(0.43, Math.max(0.05, xVal));
    } else if (talent.customPotential === "Medium") {
      xVal = Math.min(0.87, Math.max(0.45, xVal));
    } else if (talent.customPotential === "High") {
      xVal = Math.min(1.30, Math.max(0.90, xVal));
    }

    // 2. Sumbu Y (Kinerja): 12.5 to 50.0
    const details = calculateTalentPerformanceDetails(talent);
    let yVal = details.score50;

    if (talent.customPerformance === "Low") {
      yVal = Math.min(24.8, Math.max(12.7, yVal));
    } else if (talent.customPerformance === "Medium") {
      yVal = Math.min(37.3, Math.max(25.2, yVal));
    } else if (talent.customPerformance === "High") {
      yVal = Math.min(49.8, Math.max(37.7, yVal));
    }

    return {
      x: Math.min(Math.max(xVal, 0.00), 1.333333),
      y: Math.min(Math.max(yVal, 12.5), 50.0)
    };
  };

  const getTalentPlacement = (talent: TalentProfile): { performance: "Low" | "Medium" | "High"; potential: "Low" | "Medium" | "High" } => {
    const coords = getTalentCoordinates(talent);
    let potential: "Low" | "Medium" | "High" = "Medium";
    if (talent.customPotential) {
      potential = talent.customPotential;
    } else {
      // Standard SM Formula: Low <= 0.4444, Medium <= 0.8889, High > 0.8889
      if (coords.x <= 0.44444444) potential = "Low";
      else if (coords.x <= 0.88888888) potential = "Medium";
      else potential = "High";
    }

    let performance: "Low" | "Medium" | "High" = "Medium";
    if (talent.customPerformance) {
      performance = talent.customPerformance;
    } else {
      const details = calculateTalentPerformanceDetails(talent);
      performance = details.perfLevel;
    }

    return { performance, potential };
  };

  const handleCalibrateTalent = (talentId: string, performance: "Low" | "Medium" | "High", potential: "Low" | "Medium" | "High", notes?: string) => {
    setTalents(prev => prev.map(t => {
      if (t.id === talentId) {
        return {
          ...t,
          customPerformance: performance,
          customPotential: potential,
          nineBoxNotes: notes !== undefined ? notes : t.nineBoxNotes
        };
      }
      return t;
    }));
  };

  const getTalentsInCell = (perf: "Low" | "Medium" | "High", pot: "Low" | "Medium" | "High") => {
    return talents.filter(t => {
      if (nineBoxDivisionFilter !== "All" && t.division !== nineBoxDivisionFilter) {
        return false;
      }
      const placement = getTalentPlacement(t);
      return placement.performance === perf && placement.potential === pot;
    });
  };
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [readinessFilter, setReadinessFilter] = useState("All");

  // Saved Filters State
  const DEFAULT_SAVED_FILTERS: SavedFilter[] = [
    {
      id: "preset-tech-high-pot",
      name: "Kandidat High Potential (Tech)",
      searchTerm: "",
      divisionFilter: "Technology Dept.",
      readinessFilter: "READY NOW",
      description: "Kandidat siap promosi langsung di divisi Teknologi",
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: "preset-ready-1-2",
      name: "Ready 1-2 Years Pipeline",
      searchTerm: "",
      divisionFilter: "All",
      readinessFilter: "READY 1-2 YEARS",
      description: "Kandidat dalam tahap pembinaan 1-2 tahun ke depan",
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: "preset-supply-chain",
      name: "Talenta Supply Chain & Ops",
      searchTerm: "",
      divisionFilter: "Supply Chain Dept.",
      readinessFilter: "All",
      description: "Seluruh talenta di divisi Supply Chain",
      createdAt: new Date().toISOString(),
      isPreset: true,
    }
  ];

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const local = localStorage.getItem("talent_pool_saved_filters");
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {
      console.error("Failed to load saved filters:", e);
    }
    return DEFAULT_SAVED_FILTERS;
  });

  const [activeSavedFilterId, setActiveSavedFilterId] = useState<string | null>(null);
  const [isSaveFilterModalOpen, setIsSaveFilterModalOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const [newFilterDesc, setNewFilterDesc] = useState("");

  // Sync saved filters to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem("talent_pool_saved_filters", JSON.stringify(savedFilters));
    } catch (e) {
      console.error("Failed to save filters:", e);
    }
  }, [savedFilters]);

  // Apply a saved filter
  const handleApplySavedFilter = (filter: SavedFilter) => {
    setSearchTerm(filter.searchTerm || "");
    setDivisionFilter(filter.divisionFilter || "All");
    setReadinessFilter(filter.readinessFilter || "All");
    setActiveSavedFilterId(filter.id);
  };

  // Check if current filter settings match any saved filter
  React.useEffect(() => {
    const matched = savedFilters.find(f => 
      (f.searchTerm || "") === searchTerm && 
      (f.divisionFilter || "All") === divisionFilter && 
      (f.readinessFilter || "All") === readinessFilter
    );
    if (matched) {
      setActiveSavedFilterId(matched.id);
    } else {
      setActiveSavedFilterId(null);
    }
  }, [searchTerm, divisionFilter, readinessFilter, savedFilters]);

  // Save new custom filter
  const handleSaveCurrentFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name: newFilterName.trim(),
      searchTerm,
      divisionFilter,
      readinessFilter,
      description: newFilterDesc.trim() || undefined,
      createdAt: new Date().toISOString(),
      isPreset: false,
    };

    setSavedFilters(prev => [newFilter, ...prev]);
    setActiveSavedFilterId(newFilter.id);
    setIsSaveFilterModalOpen(false);
    setNewFilterName("");
    setNewFilterDesc("");
    setAdminProfileSuccessMsg(`Filter "${newFilter.name}" berhasil disimpan!`);
    setTimeout(() => setAdminProfileSuccessMsg(""), 4000);
  };

  // Delete saved filter
  const handleDeleteSavedFilter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetFilter = savedFilters.find(f => f.id === id);
    if (targetFilter?.isPreset) {
      alert("Preset filter standar sistem tidak dapat dihapus.");
      return;
    }
    triggerDeleteModal({
      title: "Hapus Filter Tersimpan?",
      itemName: targetFilter?.name || "Filter Custom",
      itemSubtitle: "Custom Filter Preset",
      warningText: "Apakah Anda yakin ingin menghapus preset filter tersimpan ini? Tindakan ini tidak dapat dibatalkan.",
      confirmButtonText: "Ya, Hapus Filter",
      onConfirm: () => {
        setSavedFilters(prev => prev.filter(f => f.id !== id));
        if (activeSavedFilterId === id) {
          setActiveSavedFilterId(null);
        }
        setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Helper to count talents matching a saved filter
  const getFilterMatchCount = (filter: SavedFilter) => {
    return talents.filter(t => {
      const matchSearch = filter.searchTerm 
        ? (t.name.toLowerCase().includes(filter.searchTerm.toLowerCase()) || 
           t.title.toLowerCase().includes(filter.searchTerm.toLowerCase()) || 
           (t.nik && t.nik.toLowerCase().includes(filter.searchTerm.toLowerCase())))
        : true;
      const matchDivision = filter.divisionFilter && filter.divisionFilter !== "All" ? t.division === filter.divisionFilter : true;
      const matchReadiness = filter.readinessFilter && filter.readinessFilter !== "All" ? t.readiness === filter.readinessFilter : true;
      return matchSearch && matchDivision && matchReadiness;
    }).length;
  };

  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [showChartLabels, setShowChartLabels] = useState(false);
  const [actionPlanSearch, setActionPlanSearch] = useState("");
  const [actionPlanPage, setActionPlanPage] = useState(1);
  const [petaSuksesiSearch, setPetaSuksesiSearch] = useState("");
  const [petaSuksesiPage, setPetaSuksesiPage] = useState(1);
  const [teaserSearch, setTeaserSearch] = useState("");
  const [quickSelectorSearch, setQuickSelectorSearch] = useState("");
  const [readinessSearch, setReadinessSearch] = useState("");

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, divisionFilter, readinessFilter]);

  // Nine-Box states
  const [selectedNineBoxTalentId, setSelectedNineBoxTalentId] = useState<string | null>(null);
  const [nineBoxDivisionFilter, setNineBoxDivisionFilter] = useState("All");
  const [nineBoxViewMode, setNineBoxViewMode] = useState<"chart" | "list" | "report">("list");
  const [reportSelectedBox, setReportSelectedBox] = useState<string | null>(null);
  const [reportSelectedZone, setReportSelectedZone] = useState<"green" | "blue" | "red" | null>(null);
  const [profileSubTab, setProfileSubTab] = useState<"profile-competencies" | "idp-training">("profile-competencies");
  const [draggedTalentId, setDraggedTalentId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  const handleResetNineBoxCalibrations = () => {
    setTalents(prev => prev.map(t => ({
      ...t,
      customPerformance: undefined,
      customPotential: undefined,
      nineBoxNotes: undefined
    })));
    setSyncNotification("Semua kalibrasi manual telah di-reset. Matriks 9-Box kembali mengikuti data asesmen asli secara otomatis.");
    setTimeout(() => setSyncNotification(null), 5000);
  };

  const handleRefreshNineBoxData = () => {
    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSyncNotification(`Bagan 9-Box Tools berhasil diperbarui dengan data asesmen & evaluasi kinerja terbaru (${timeStr} WIB).`);
    setTimeout(() => setSyncNotification(null), 5000);
  };

  React.useEffect(() => {
    setPetaSuksesiPage(1);
  }, [petaSuksesiSearch, nineBoxDivisionFilter]);

  React.useEffect(() => {
    setActionPlanPage(1);
  }, [actionPlanSearch, reportSelectedBox, reportSelectedZone, nineBoxDivisionFilter]);

  // Interaction states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOverallSummaryModalOpen, setIsOverallSummaryModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isEditingScores, setIsEditingScores] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAdminMasterModalOpen, setIsAdminMasterModalOpen] = useState(false);
  const [adminProfileSuccessMsg, setAdminProfileSuccessMsg] = useState("");
  const [editProfileForm, setEditProfileForm] = useState<any | null>(null);

  // Redesigned Delete Confirmation Modal state
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState<DeleteConfirmModalConfig>({
    isOpen: false,
    title: "Konfirmasi Hapus Data",
    itemName: "",
    itemSubtitle: "",
    itemBadge: "",
    warningText: "",
    confirmButtonText: "Ya, Hapus Permanent",
    onConfirm: () => {},
  });

  const triggerDeleteModal = (config: Omit<DeleteConfirmModalConfig, "isOpen">) => {
    setDeleteConfirmConfig({
      ...config,
      isOpen: true,
    });
  };

  // Interactive Supabase Notification Popup State
  const [supabaseModal, setSupabaseModal] = useState<SupabaseNoticeModalConfig>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showSupabasePopup = (
    type: "success" | "error" | "info" | "syncing",
    title: string,
    message: string,
    details?: string,
    sqlSnippet?: string
  ) => {
    setSupabaseModal({
      isOpen: true,
      type,
      title,
      message,
      details,
      sqlSnippet,
    });
  };

  // Sidebar Collapse & Keyboard Shortcuts state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [commandSearch, setCommandSearch] = useState<string>("");
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  // Global Keyboard Shortcuts Event Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isEditingText = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";

      // Escape key closes open modals/palettes
      if (e.key === "Escape") {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          e.preventDefault();
          return;
        }
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          e.preventDefault();
          return;
        }
        if (deleteConfirmConfig.isOpen) {
          setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
          e.preventDefault();
          return;
        }
        if (isReportModalOpen) {
          setIsReportModalOpen(false);
          e.preventDefault();
          return;
        }
        if (isOverallSummaryModalOpen) {
          setIsOverallSummaryModalOpen(false);
          e.preventDefault();
          return;
        }
      }

      // Ctrl + B or Cmd + B: Toggle Sidebar Collapse (Perkecil / Perlebar Sidebar)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed(prev => {
          const next = !prev;
          setShortcutToast(next ? "Sidebar Diperkecil (Collapsed)" : "Sidebar Diperlebar (Expanded)");
          setTimeout(() => setShortcutToast(null), 2500);
          return next;
        });
        return;
      }

      // Ctrl + K or Cmd + K: Open Command Palette / Quick Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        setCommandSearch("");
        return;
      }

      // ? Key or Ctrl + /: Open Shortcuts Modal
      if ((e.key === "?" && !isEditingText) || ((e.ctrlKey || e.metaKey) && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }

      // Skip single-key or Alt shortcuts when typing in inputs
      if (isEditingText) return;

      // Alt + 1-5: Module Navigation Shortcuts
      if (e.altKey) {
        if (e.key === "1" && userRole === "admin") {
          e.preventDefault();
          setActiveTab("home");
          setShortcutToast("Shortcut: Dashboard Overview (Alt+1)");
          setTimeout(() => setShortcutToast(null), 2000);
        } else if (e.key === "2" && userRole === "admin") {
          e.preventDefault();
          setActiveTab("talent-pool");
          setShortcutToast("Shortcut: Talent Pool Directory (Alt+2)");
          setTimeout(() => setShortcutToast(null), 2000);
        } else if (e.key === "3" && userRole === "admin") {
          e.preventDefault();
          setActiveTab("nine-box");
          setShortcutToast("Shortcut: Nine-Box Placement (Alt+3)");
          setTimeout(() => setShortcutToast(null), 2000);
        } else if (e.key === "4") {
          e.preventDefault();
          setActiveTab("profile");
          setShortcutToast("Shortcut: Profil Details (Alt+4)");
          setTimeout(() => setShortcutToast(null), 2000);
        } else if (e.key === "5" && userRole === "admin") {
          e.preventDefault();
          setActiveTab("settings");
          setShortcutToast("Shortcut: Advisory Controls (Alt+5)");
          setTimeout(() => setShortcutToast(null), 2000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, isShortcutsModalOpen, deleteConfirmConfig.isOpen, isReportModalOpen, isOverallSummaryModalOpen, userRole]);

  // Filtered command talents
  const filteredCommandTalents = talents.filter(t => 
    !commandSearch.trim() || 
    t.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
    t.division.toLowerCase().includes(commandSearch.toLowerCase()) ||
    t.title.toLowerCase().includes(commandSearch.toLowerCase()) ||
    (t.nik && t.nik.toLowerCase().includes(commandSearch.toLowerCase()))
  );

  // Email Dispatch Modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailType, setEmailType] = useState<"summary" | "individual">("summary");
  const [emailTargetTalentId, setEmailTargetTalentId] = useState<string | null>(null);
  const [emailPresetRecipient, setEmailPresetRecipient] = useState<"bod" | "hr_head" | "dept_head" | "my_email" | "custom">("bod");
  const [emailForm, setEmailForm] = useState({
    recipientEmail: "bod.komite@ajinomoto.co.id",
    ccEmail: "hrd.head@ajinomoto.co.id, talent.committee@ajinomoto.co.id",
    subject: "",
    message: "",
    attachPdf: true,
    attachCsv: true,
    attachExecutiveSummary: true,
  });
  const [emailSendingStatus, setEmailSendingStatus] = useState<"idle" | "sending" | "success">("idle");
  const [emailSendingStep, setEmailSendingStep] = useState<string>("");
  const [emailSentLog, setEmailSentLog] = useState<Array<{
    id: string;
    type: "summary" | "individual";
    targetName?: string;
    recipient: string;
    subject: string;
    sentAt: string;
    status: string;
  }>>([]);

  const handleOpenSendEmail = (type: "summary" | "individual", targetTalentId?: string) => {
    const tid = targetTalentId || selectedTalentId;
    setEmailType(type);
    setEmailTargetTalentId(tid);
    setEmailSendingStatus("idle");
    setEmailSendingStep("");

    const targetTalent = talents.find(t => t.id === tid) || talents.find(t => t.id === selectedTalentId) || talents[0];

    if (type === "summary") {
      const highPotCount = talents.filter(t => getTalentPlacement(t).potential === "High").length;
      setEmailPresetRecipient("bod");
      setEmailForm({
        recipientEmail: "bod.komite@ajinomoto.co.id",
        ccEmail: "hrd.head@ajinomoto.co.id, talent.committee@ajinomoto.co.id",
        subject: `[CONFIDENTIAL] Laporan Rangkuman Eksekutif Data System Nine-Box & Peta Suksesi - PT Ajinomoto Indonesia`,
        message: `Yth. Bapak/Ibu Direksi & Komite Kalibrasi Talenta,

Bersama surat elektronik ini kami sampaikan Laporan Rangkuman Eksekutif Keseluruhan Data System Nine-Box & Peta Suksesi PT Ajinomoto Indonesia per tanggal ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}.

RINGKASAN KONSOLIDASI SISTEM:
• Total Talenta Master Ter-evaluasi: ${talents.length} Kandidat
• Talenta High Potential (Star Performers): ${highPotCount} Talenta
• Coverage Suksesi Jabatan Pensiun: ${retiringPositions.length} Jabatan Ter-cover

Dokumen Rangkuman Eksekutif PDF & Dataset Master CSV terlampir sebagai bahan acuan resmi rapat keputusan promosi dan kalibrasi suksesi kepemimpinan.

Hormat kami,
Komite Talenta & Human Capital Management
PT Ajinomoto Indonesia`,
        attachPdf: true,
        attachCsv: true,
        attachExecutiveSummary: true,
      });
    } else {
      const perfScore = targetTalent ? getTalentPerformanceScore(targetTalent) : 80;
      const potDetails = targetTalent ? calculateTalentPotentialDetails(targetTalent) : { totalPotentialScore: 80 };
      const potScore = Math.round(potDetails.totalPotentialScore);
      const overallRating = Math.round((perfScore + potScore) / 2);
      const placement: { performance: "Low" | "Medium" | "High"; potential: "Low" | "Medium" | "High" } = targetTalent ? getTalentPlacement(targetTalent) : { performance: "High", potential: "High" };
      const cellName = getCellName(placement.performance, placement.potential);

      setEmailPresetRecipient("hr_head");
      setEmailForm({
        recipientEmail: "hrd.head@ajinomoto.co.id",
        ccEmail: "bod.komite@ajinomoto.co.id, " + (targetTalent?.division ? `${targetTalent.division.toLowerCase().replace(/[^a-z0-9]/g, '')}@ajinomoto.co.id` : "manager@ajinomoto.co.id"),
        subject: `[CONFIDENTIAL] Laporan Assessment Individual Talenta - ${targetTalent?.name || "Kandidat"} (${targetTalent?.title || "Section Manager"})`,
        message: `Yth. Komite Talenta & Head of Department,

Berikut disampaikan Laporan Assessment Individual & Profil Kalibrasi Talenta resmi untuk:

• Nama Talenta: ${targetTalent?.name || "Kandidat"}
• NIK / Jabatan: ${targetTalent?.nik || "N/A"} - ${targetTalent?.title || "-"}
• Divisi / Departemen: ${targetTalent?.division || "-"}
• Rating Kinerja: ${perfScore}% | Rating Potensi: ${potScore}% (Rating Total: ${overallRating}%)
• Klasifikasi Nine-Box: ${cellName}

Dokumen Laporan Individual lengkap terlampir dalam format PDF sebagai bahan acuan penetapan Individual Development Plan (IDP) dan rekomendasi suksesi.

Hormat kami,
Komite Talenta
PT Ajinomoto Indonesia`,
        attachPdf: true,
        attachCsv: false,
        attachExecutiveSummary: true,
      });
    }

    setIsEmailModalOpen(true);
  };

  const handleEmailPresetChange = (preset: "bod" | "hr_head" | "dept_head" | "my_email" | "custom") => {
    setEmailPresetRecipient(preset);
    let recipient = "";
    if (preset === "bod") recipient = "bod.komite@ajinomoto.co.id";
    else if (preset === "hr_head") recipient = "hrd.head@ajinomoto.co.id";
    else if (preset === "dept_head") recipient = "dept.head@ajinomoto.co.id";
    else if (preset === "my_email") recipient = "mahmudnurdiansyah4@gmail.com";
    setEmailForm(prev => ({ ...prev, recipientEmail: recipient }));
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.recipientEmail) return;

    setEmailSendingStatus("sending");
    setEmailSendingStep("Menyiapkan berkas laporan & rendering lampiran PDF/CSV...");

    try {
      setEmailSendingStep("Menghubungkan ke Backend Server Express / SMTP Gateway...");
      
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm)
      });

      const data = await response.json();
      const targetTalent = talents.find(t => t.id === emailTargetTalentId);

      if (data.delivered) {
        setEmailSendingStatus("success");
        setEmailSentLog(prev => [
          {
            id: Date.now().toString(),
            type: emailType,
            targetName: emailType === "individual" ? (targetTalent?.name || "Kandidat Individual") : "Summary System BOD",
            recipient: emailForm.recipientEmail,
            subject: emailForm.subject,
            sentAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            status: "Terkirim Real via Server SMTP (200 OK)"
          },
          ...prev
        ]);
      } else {
        setEmailSendingStatus("success");
        setEmailSentLog(prev => [
          {
            id: Date.now().toString(),
            type: emailType,
            targetName: emailType === "individual" ? (targetTalent?.name || "Kandidat Individual") : "Summary System BOD",
            recipient: emailForm.recipientEmail,
            subject: emailForm.subject,
            sentAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            status: "Simulasi Server Log (200 OK)"
          },
          ...prev
        ]);
      }
    } catch (error) {
      console.error("Failed to send email via API:", error);
      setEmailSendingStatus("success");
      const targetTalent = talents.find(t => t.id === emailTargetTalentId);
      setEmailSentLog(prev => [
        {
          id: Date.now().toString(),
          type: emailType,
          targetName: emailType === "individual" ? (targetTalent?.name || "Kandidat Individual") : "Summary System BOD",
          recipient: emailForm.recipientEmail,
          subject: emailForm.subject,
          sentAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          status: "Simulasi In-App Gateway (200 OK)"
        },
        ...prev
      ]);
    }
  };

  const handleDirectMailto = () => {
    const subjectEncoded = encodeURIComponent(emailForm.subject);
    const bodyEncoded = encodeURIComponent(emailForm.message);
    const mailtoUrl = `mailto:${emailForm.recipientEmail}?cc=${encodeURIComponent(emailForm.ccEmail)}&subject=${subjectEncoded}&body=${bodyEncoded}`;
    window.open(mailtoUrl, "_blank");
  };

  const handleOpenInGmail = () => {
    const subjectEncoded = encodeURIComponent(emailForm.subject);
    const bodyEncoded = encodeURIComponent(emailForm.message);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailForm.recipientEmail)}&cc=${encodeURIComponent(emailForm.ccEmail)}&su=${subjectEncoded}&body=${bodyEncoded}`;
    window.open(gmailUrl, "_blank");
  };

  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("adminProfile");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Gagal membaca adminProfile dari localStorage", e);
    }
    return {
      name: "Marcus Sterling",
      title: "Chief Talent Officer (Admin)",
      initials: "MS",
      department: "Human Capital Management Dept.",
      email: "admin.hr@ajinomoto.co.id",
      notes: "Otorisasi Administrator Master untuk Komite Talent Suksesi PT Ajinomoto Indonesia",
      lastSaved: ""
    };
  });

  const handleSaveAdminMasterProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nowStr = new Date().toLocaleDateString("id-ID", {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const words = (adminProfile.name || "").trim().split(/\s+/);
    const initials = words.map(w => w[0]).join("").substring(0, 3).toUpperCase() || "AD";

    const updatedProfile = {
      ...adminProfile,
      initials,
      lastSaved: nowStr
    };

    setAdminProfile(updatedProfile);
    try {
      localStorage.setItem("adminProfile", JSON.stringify(updatedProfile));
    } catch (err) {
      console.error("Gagal menyimpan adminProfile ke localStorage", err);
    }

    addSecurityLog(`Profil Administrator Master ("${updatedProfile.name}") berhasil diperbarui dan disimpan.`, "success");
    setAdminProfileSuccessMsg(`Profil Master Admin "${updatedProfile.name}" berhasil disimpan!`);
    setTimeout(() => setAdminProfileSuccessMsg(""), 4000);

    if (isAdminMasterModalOpen) {
      setIsAdminMasterModalOpen(false);
    }
  };

  const handleDeleteTalent = (talentId: string, talentName?: string) => {
    const target = talents.find(t => t.id === talentId);
    const name = talentName || target?.name || "Talenta";
    const title = target?.title || "Staff / Managerial";
    const division = target?.division || "Division";

    triggerDeleteModal({
      title: "Hapus Profil Talenta?",
      itemName: name,
      itemSubtitle: `${title} • ${division}`,
      itemBadge: target?.nik ? `NIK: ${target.nik}` : `ID: ${talentId}`,
      warningText: "Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Seluruh data penilaian kinerja, evaluasi 9-box, kompetensi, dan riwayat IDP talenta ini akan dihapus dari sistem master.",
      confirmButtonText: "Ya, Hapus Profil Talenta",
      onConfirm: () => {
        const updatedTalents = talents.filter(t => t.id !== talentId);
        setTalents(updatedTalents);

        if (selectedTalentId === talentId) {
          if (updatedTalents.length > 0) {
            setSelectedTalentId(updatedTalents[0].id);
          }
        }

        if (selectedNineBoxTalentId === talentId) {
          setSelectedNineBoxTalentId(updatedTalents.length > 0 ? updatedTalents[0].id : null);
        }

        setRetiringPositions(prev => prev.map(pos => {
          if (pos.selectedSuccessorId === talentId) {
            return { ...pos, selectedSuccessorId: undefined };
          }
          return pos;
        }));

        if (isEditProfileModalOpen && editProfileForm?.id === talentId) {
          setIsEditProfileModalOpen(false);
        }

        addSecurityLog(`Data talenta "${name}" (ID: ${talentId}) berhasil dihapus dari sistem master suksesi.`, "warning");
        setAdminProfileSuccessMsg(`Data talenta "${name}" telah berhasil dihapus secara permanen.`);
        setTimeout(() => setAdminProfileSuccessMsg(""), 4000);
        setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleOpenEditProfile = () => {
    const dynamicCurrentTalent = talents.find((t) => t.id === selectedTalentId) || talents[0];
    const gender = dynamicCurrentTalent.gender || detectGenderFromName(dynamicCurrentTalent.name);
    setEditProfileForm({ ...dynamicCurrentTalent, gender });
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileForm) return;
    
    let updatedForm = { ...editProfileForm };
    if (!updatedForm.gender) {
      updatedForm.gender = detectGenderFromName(updatedForm.name);
    }
    
    if (updatedForm.birthDate) {
      const birthYear = new Date(updatedForm.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear)) {
        updatedForm.age = currentYear - birthYear;
      }
    }
    
    if (updatedForm.readiness === "READY NOW") {
      updatedForm.readinessColor = "emerald";
    } else if (updatedForm.readiness === "READY 1-2 YEARS") {
      updatedForm.readinessColor = "amber";
    } else {
      updatedForm.readinessColor = "rose";
    }

    setTalents((prev) =>
      prev.map((t) => (t.id === updatedForm.id ? updatedForm : t))
    );
    setIsEditProfileModalOpen(false);
    addSecurityLog(`Profil lengkap talenta "${updatedForm.name}" berhasil diperbarui.`, "success");
  };

  const [executiveCommentary, setExecutiveCommentary] = useState<Record<string, string>>({
    "edwin-prasetyo": "Edwin is a high-caliber digital transformation strategist. His exceptional strategic mindset paired with deep technology expertise positions him well for C-suite roles in the near term. Ongoing executive coaching will accelerate his lateral influence capabilities.",
    "siti-rahma": "Siti shows flawless financial stewardship and expert decision-making capabilities. She has strong business outcome momentum and is fully ready to take on broader VP or Chief Financial officer capacities immediately.",
    "budi-santoso": "Budi is an outstanding people advocate with maximum scores in stakeholder alignment. He excels at building strategic culture, and with structured AI/predictive tool training, he will be a phenomenal candidate for HCM leadership.",
    "amanda-collins": "Amanda is a brilliant growth expert with top-tier partnership negotiation skills. She thrives in fast-paced international frameworks. Strategic financial and compliance certifications will cement her readiness for key regional VP roles."
  });

  // Security & Encrypted Vault States
  const [isVaultEnabled, setIsVaultEnabled] = useState(false);
  const [isVaultLocked, setIsVaultLocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState("ajinomoto-secure");
  const [vaultError, setVaultError] = useState("");
  const [encryptedCommentaries, setEncryptedCommentaries] = useState<Record<string, { ciphertext: string, salt: string, iv: string }>>({});
  const [securityLogs, setSecurityLogs] = useState<Array<{ id: string; timestamp: string; action: string; type: "success" | "warning" | "info" }>>([
    { id: "1", timestamp: new Date().toLocaleTimeString(), action: "Sistem keamanan diinisialisasi. AES-256-GCM siap digunakan.", type: "info" }
  ]);

  const addSecurityLog = (action: string, type: "success" | "warning" | "info" = "info") => {
    setSecurityLogs((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        action,
        type
      },
      ...prev
    ]);
  };

  // Evaluation years state for dynamic FY management
  const [evaluationYears, setEvaluationYears] = useState<string[]>([
    "2020", "2021", "2022", "2023", "2024"
  ]);

  // Supabase Integration States
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<"idle" | "success" | "error" | "unconfigured">(
    getSupabaseConfig().isEnabled ? "idle" : "unconfigured"
  );
  const [supabaseError, setSupabaseError] = useState("");
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);

  // Auto-load data from Supabase if enabled
  React.useEffect(() => {
    const initSync = async () => {
      const config = getSupabaseConfig();
      if (config.isEnabled) {
        setIsSupabaseSyncing(true);
        setSupabaseStatus("idle");
        const res = await pullFromSupabase();
        if (res.success && res.data) {
          if (res.data.talents && res.data.talents.length > 0) {
            setTalents(res.data.talents);
          }
          if (res.data.retiring_positions && res.data.retiring_positions.length > 0) {
            setRetiringPositions(res.data.retiring_positions);
          }
          if (res.data.evaluation_years && res.data.evaluation_years.length > 0) {
            setEvaluationYears(res.data.evaluation_years);
          }
          setSupabaseStatus("success");
          addSecurityLog("Berhasil sinkronisasi dan memuat data otomatis dari database Supabase.", "success");
        } else {
          setSupabaseStatus("error");
          setSupabaseError(res.error || "Gagal memuat data.");
          addSecurityLog(`Koneksi Supabase aktif namun gagal menarik data otomatis: ${res.error || 'Tabel belum siap'}. Silakan periksa tabel atau lakukan push data pertama kali.`, "warning");
        }
        setIsSupabaseSyncing(false);
      }
    };
    initSync();
  }, []);

  // Debounced Auto-sync on changes
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isAutoSyncEnabled && supabaseConfig.isEnabled) {
      const delayDebounce = setTimeout(async () => {
        setIsSupabaseSyncing(true);
        const res = await pushToSupabase(talents, retiringPositions, evaluationYears);
        if (res.success) {
          setSupabaseStatus("success");
          setSupabaseError("");
        } else {
          setSupabaseStatus("error");
          setSupabaseError(res.error || "Auto-sync gagal");
        }
        setIsSupabaseSyncing(false);
      }, 1000);
      return () => clearTimeout(delayDebounce);
    }
  }, [talents, retiringPositions, evaluationYears, isAutoSyncEnabled, supabaseConfig.isEnabled]);

  // Sync operations handlers
  const handlePushToSupabase = async () => {
    setIsSupabaseSyncing(true);
    setSupabaseStatus("idle");
    setSupabaseError("");
    showSupabasePopup(
      "syncing",
      "Mengunggah Data ke Supabase...",
      "Sistem sedang menyinkronkan seluruh data talenta, posisi suksesi, dan tahun evaluasi ke cloud database."
    );

    const res = await pushToSupabase(talents, retiringPositions, evaluationYears);
    setIsSupabaseSyncing(false);

    if (res.success) {
      setSupabaseStatus("success");
      addSecurityLog("Berhasil mengunggah seluruh data suksesi ke database Supabase.", "success");
      showSupabasePopup(
        "success",
        "Sinkronisasi Push Berhasil!",
        "Seluruh data Peta Suksesi dan Talenta telah tersimpan dengan aman di database Supabase Cloud.",
        `Data tersinkronkan: ${talents.length} Talenta, ${retiringPositions.length} Posisi Pensiun, ${evaluationYears.length} Tahun Evaluasi.`
      );
    } else {
      setSupabaseStatus("error");
      setSupabaseError(res.error || "Gagal melakukan push");
      addSecurityLog(`Gagal mengunggah data ke Supabase: ${res.error}.`, "warning");
      showSupabasePopup(
        "error",
        "Gagal Menyinkronkan ke Supabase",
        res.error || "Gagal mengunggah data ke Supabase.",
        "Pastikan tabel 'succession_data' sudah dibuat di Supabase SQL Editor. Gunakan perintah SQL di bawah ini untuk membuat tabel otomatis.",
        `create table if not exists succession_data (
  id text primary key,
  talents jsonb not null,
  retiring_positions jsonb not null,
  evaluation_years jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table succession_data enable row level security;

drop policy if exists "Allow public read and write" on succession_data;
create policy "Allow public read and write" on succession_data for all using (true) with check (true);

grant all on succession_data to anon, authenticated, service_role;`
      );
    }
  };

  const handlePullFromSupabase = async () => {
    setIsSupabaseSyncing(true);
    setSupabaseStatus("idle");
    setSupabaseError("");
    showSupabasePopup(
      "syncing",
      "Mengunduh Data dari Supabase...",
      "Sistem sedang mengambil data suksesi terbaru dari database Supabase Cloud."
    );

    const res = await pullFromSupabase();
    setIsSupabaseSyncing(false);

    if (res.success && res.data) {
      if (res.data.talents && res.data.talents.length > 0) {
        setTalents(res.data.talents);
      }
      if (res.data.retiring_positions && res.data.retiring_positions.length > 0) {
        setRetiringPositions(res.data.retiring_positions);
      }
      if (res.data.evaluation_years && res.data.evaluation_years.length > 0) {
        setEvaluationYears(res.data.evaluation_years);
      }
      setSupabaseStatus("success");
      addSecurityLog("Berhasil mengunduh dan memperbarui data suksesi dari database Supabase.", "success");
      showSupabasePopup(
        "success",
        "Sinkronisasi Pull Berhasil!",
        "Data suksesi terbaru berhasil diunduh dari Supabase dan telah diperbarui di sistem lokal Anda.",
        `Terunduh: ${res.data?.talents?.length || 0} Talenta, ${res.data?.retiring_positions?.length || 0} Posisi Pensiun.`
      );
    } else {
      setSupabaseStatus("error");
      setSupabaseError(res.error || "Gagal melakukan pull");
      addSecurityLog(`Gagal menarik data dari Supabase: ${res.error}.`, "warning");
      showSupabasePopup(
        "error",
        "Gagal Mengunduh dari Supabase",
        res.error || "Gagal mengambil data dari Supabase.",
        "Pastikan URL & Anon Key valid, serta tabel 'succession_data' di Supabase telah diisi data."
      );
    }
  };

  const handleSaveSupabaseConfigChange = (url: string, key: string, enabled: boolean) => {
    const updated = { url, anonKey: key, isEnabled: enabled };
    saveSupabaseConfig(updated);
    setSupabaseConfig(getSupabaseConfig());
    if (enabled && url && key) {
      setSupabaseStatus("idle");
      addSecurityLog(`Konfigurasi Supabase diperbarui. URL target: ${url}`, "info");
      showSupabasePopup(
        "success",
        "Konfigurasi Supabase Disimpan!",
        "Koneksi ke Supabase berhasil diperbarui dan fitur auto-sync real-time telah aktif.",
        `Project URL: ${url}`
      );
    } else {
      setSupabaseStatus("unconfigured");
      addSecurityLog("Koneksi Supabase dinonaktifkan oleh admin.", "info");
      showSupabasePopup(
        "info",
        "Koneksi Supabase Diputus",
        "Sinkronisasi Supabase dinonaktifkan. Data sistem Anda akan tersimpan secara aman di peramban lokal."
      );
    }
  };

  const handleTestSupabaseConnection = async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      showSupabasePopup(
        "error",
        "Konfigurasi Belum Lengkap",
        "URL Project dan Anon Key Supabase harus diisi terlebih dahulu.",
        "Masukkan URL dan Anon Key pada formulir di bawah ini lalu klik 'Simpan & Hubungkan'."
      );
      return;
    }

    setIsSupabaseSyncing(true);
    showSupabasePopup(
      "syncing",
      "Menguji Koneksi Supabase...",
      "Sistem sedang memverifikasi respon server dan ketersediaan tabel 'succession_data' di Supabase Cloud."
    );

    const res = await pullFromSupabase();
    setIsSupabaseSyncing(false);

    if (res.success) {
      setSupabaseStatus("success");
      setSupabaseError("");
      showSupabasePopup(
        "success",
        "Koneksi Supabase Sukses!",
        "Database Supabase Cloud terhubung sempurna dan siap untuk sinkronisasi data real-time.",
        `Status: Online & Responsive | Target URL: ${supabaseConfig.url}`
      );
    } else {
      setSupabaseStatus("error");
      setSupabaseError(res.error || "Gagal menyambung");
      showSupabasePopup(
        "error",
        "Gagal Menyambung ke Supabase",
        res.error || "Server Supabase menolak akses atau tabel belum disiapkan.",
        "Jalankan skema SQL inisialisasi di bawah ini di SQL Editor Supabase Anda untuk membuat tabel 'succession_data'.",
        `create table if not exists succession_data (
  id text primary key,
  talents jsonb not null,
  retiring_positions jsonb not null,
  evaluation_years jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table succession_data enable row level security;

drop policy if exists "Allow public read and write" on succession_data;
create policy "Allow public read and write" on succession_data for all using (true) with check (true);

grant all on succession_data to anon, authenticated, service_role;`
      );
    }
  };

  const handleAddEvaluationYear = (newYear: string) => {
    const trimmed = newYear.trim();
    if (!trimmed) return;
    if (!/^\d{4}$/.test(trimmed)) {
      alert("Format tahun tidak valid! Silakan masukkan 4 digit angka (misalnya: 2025).");
      return;
    }
    if (evaluationYears.includes(trimmed)) {
      alert(`Tahun Evaluasi FY ${trimmed} sudah ada!`);
      return;
    }
    // Sort years ascending
    const updated = [...evaluationYears, trimmed].sort((a, b) => parseInt(a) - parseInt(b));
    setEvaluationYears(updated);
    
    // Auto-populate the new FY in all talents with default rating 3
    setTalents((prevTalents) =>
      prevTalents.map((t) => {
        const prevEval = t.performanceEvaluation || {};
        return {
          ...t,
          performanceEvaluation: {
            ...prevEval,
            [`fy${trimmed}`]: 3
          }
        };
      })
    );
    addSecurityLog(`Tahun evaluasi baru FY ${trimmed} berhasil ditambahkan dan diinisialisasi untuk seluruh talent.`, "success");
  };

  const handleRemoveEvaluationYear = (yearToRemove: string) => {
    if (evaluationYears.length <= 1) {
      alert("Sistem membutuhkan minimal 1 tahun evaluasi untuk menghitung rata-rata.");
      return;
    }
    triggerDeleteModal({
      title: "Hapus Tahun Evaluasi FY?",
      itemName: `Tahun Evaluasi FY ${yearToRemove}`,
      itemSubtitle: "Pengaturan Kolom Master",
      warningText: `Apakah Anda yakin ingin menghapus tahun evaluasi FY ${yearToRemove}? Penghapusan ini juga akan membuang data bobot dan nilai penilaian kinerja terkait pada tahun tersebut.`,
      confirmButtonText: "Ya, Hapus Tahun Evaluasi",
      onConfirm: () => {
        setEvaluationYears((prev) => prev.filter((y) => y !== yearToRemove));
        addSecurityLog(`Tahun evaluasi FY ${yearToRemove} berhasil dihapus dari sistem.`, "warning");
        setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEnableVault = async (passphrase: string) => {
    try {
      setVaultError("");
      const hashed = await calculateHash(passphrase);
      addSecurityLog(`Mengaktifkan Secure Vault dengan kunci SHA-256: ${hashed.slice(0, 16)}...`, "info");
      
      const newEncrypted: Record<string, { ciphertext: string, salt: string, iv: string }> = {};
      for (const [key, value] of Object.entries(executiveCommentary) as Array<[string, string]>) {
        const encrypted = await encryptText(value, passphrase);
        newEncrypted[key] = encrypted;
        addSecurityLog(`Komentar untuk talent ID '${key}' berhasil dienkripsi menggunakan AES-GCM-256.`, "success");
      }
      
      setEncryptedCommentaries(newEncrypted);
      setIsVaultEnabled(true);
      setVaultPassphrase(passphrase);
      addSecurityLog("Enkripsi AES-256-GCM aktif di seluruh sistem data suksesi.", "success");
    } catch (err: any) {
      setVaultError(err.message || "Gagal mengaktifkan enkripsi.");
      addSecurityLog("Gagal mengaktifkan Secure Vault.", "warning");
    }
  };

  const handleLockVault = () => {
    setIsVaultLocked(true);
    // Overwrite plain commentary text to make sure it's not exposed
    setExecutiveCommentary({
      "edwin-prasetyo": "[DIAMANKAN - AES-256 ENCRYPTED DATA VAULT]",
      "siti-rahma": "[DIAMANKAN - AES-256 ENCRYPTED DATA VAULT]",
      "budi-santoso": "[DIAMANKAN - AES-256 ENCRYPTED DATA VAULT]",
      "amanda-collins": "[DIAMANKAN - AES-256 ENCRYPTED DATA VAULT]"
    });
    addSecurityLog("Kubah data (Secure Vault) TERKUNCI. Seluruh plain-text dibersihkan dari memori aktif.", "warning");
  };

  const handleUnlockVault = async (passphrase: string) => {
    try {
      setVaultError("");
      addSecurityLog("Mencoba membuka kunci kubah data. Menghitung kunci PBKDF2...", "info");
      
      const decrypted: Record<string, string> = {};
      for (const [key, enc] of Object.entries(encryptedCommentaries) as Array<[string, { ciphertext: string, salt: string, iv: string }]>) {
        const plain = await decryptText(enc.ciphertext, passphrase, enc.salt, enc.iv);
        decrypted[key] = plain;
        addSecurityLog(`Komentar untuk talent ID '${key}' berhasil didekripsi. Integritas data valid.`, "success");
      }
      
      setExecutiveCommentary(decrypted);
      setIsVaultLocked(false);
      setVaultPassphrase(passphrase);
      addSecurityLog("Kubah data berhasil dibuka. Seluruh data sensitif didekripsi dengan sukses.", "success");
    } catch (err: any) {
      setVaultError("Kata sandi dekripsi salah atau data terkorupsi.");
      addSecurityLog("Gagal membuka kubah data: Kata sandi tidak valid.", "warning");
    }
  };

  const handleUpdateAndEncryptCommentary = async (talentId: string, text: string) => {
    if (isVaultEnabled && !isVaultLocked) {
      try {
        const encrypted = await encryptText(text, vaultPassphrase);
        setEncryptedCommentaries(prev => ({
          ...prev,
          [talentId]: encrypted
        }));
        addSecurityLog(`Komentar baru untuk talent ID '${talentId}' telah dienkripsi secara real-time.`, "success");
      } catch (err) {
        addSecurityLog("Gagal mengenkripsi komentar baru secara real-time.", "warning");
      }
    }
    setExecutiveCommentary(prev => ({
      ...prev,
      [talentId]: text
    }));
  };

  const handleExportCSV = () => {
    // Columns headers matching system terminology ("Department / Divisi", "Jabatan", etc.)
    const headers = [
      "ID",
      "Nama Lengkap",
      "Jenis Kelamin (Laki-laki / Perempuan)",
      "NIK Karyawan",
      "Jabatan",
      "Department / Divisi",
      "Lokasi Kerja",
      "Masa Kerja (Tenure)",
      "Kesiapan (READY NOW / READY 1-2 YEARS / READY 2+ YEARS)",
      "Avatar URL",
      "Grade (M5-M1 / ST5-ST1)",
      "Tanggal Lahir (YYYY-MM-DD)",
      "Umur (Tahun)",
      "Tanggal Masuk (YYYY-MM-DD)",
      "Riwayat Pelatihan / Training",
      "Kinerja Evaluation FY2020 (1-5)",
      "Kinerja Evaluation FY2021 (1-5)",
      "Kinerja Evaluation FY2022 (1-5)",
      "Kinerja Evaluation FY2023 (1-5)",
      "Kinerja Evaluation FY2024 (1-5)",
      "Kustom Kinerja Nine-Box (Low / Medium / High)",
      "Kustom Potensi Nine-Box (Low / Medium / High)",
      "Catatan Evaluasi Nine-Box",
      "Skor Logical Reasoning (0-100)",
      "Skor Leadership Potential (0-100)",
      "Skor Emotional Agility (0-100)",
      "Kompetensi Business Knowledge (0-100)",
      "Kompetensi Leadership (0-100)",
      "Kompetensi Problem Solving (0-100)",
      "Kompetensi Interpersonal Skill (0-100)",
      "IDP 1: Judul Program",
      "IDP 1: Deskripsi",
      "IDP 1: Progres (0-100)",
      "IDP 2: Judul Program",
      "IDP 2: Deskripsi",
      "IDP 2: Progres (0-100)",
      "Asesmen Kemampuan Intelektual (1-3)",
      "Asesmen Berpikir Kritis (1-3)",
      "Asesmen Menyelesaikan Masalah (1-3)",
      "Asesmen Belajar Cepat (1-3)",
      "Asesmen Kesadaran Diri (1-3)",
      "Asesmen Interpersonal (1-3)",
      "Asesmen Kecerdasan Emosional (1-3)",
      "Asesmen Motivasi & Komitmen (1-3)",
      "Nilai Standar Business Knowledge (1-5)",
      "Nilai Standar Leadership (1-5)",
      "Nilai Standar Problem Solving (1-5)",
      "Nilai Standar Interpersonal Skill (1-5)",
      "Nilai Standar Strategic Mindset (1-5)",
      "Nilai Standar Manages Complexity (1-5)",
      "Nilai Standar Ensures Accountability (1-5)",
      "Nilai Standar Drives Vision (1-5)",
      "Nilai Standar Cultivate Innovation (1-5)",
      "Latar Belakang Studi (Nama)",
      "Latar Belakang Studi (Skor 1-3)",
      "Target Tingkat Jabatan (SM / DM)",
      "Nilai Evaluasi Kinerja (Sumbu Y 12.5-50.0)",
      "Persentase Kinerja (%)",
      "Kode Kategori Evaluasi (1=Rendah, 2=Sedang, 3=Tinggi)",
      "Kategori Evaluasi Kinerja",
      "Nomor Kotak Nine-Box (1-9)"
    ];

    const rows = talents.map(t => {
      const lr = t.psychometric?.logicalReasoning?.score ?? 80;
      const lp = t.psychometric?.leadershipPotential?.score ?? 80;
      const ea = t.psychometric?.emotionalAgility?.score ?? 80;

      const bk = t.competencies?.find(c => c.name === "Business Knowledge")?.score ?? 80;
      const ld = t.competencies?.find(c => c.name === "Leadership")?.score ?? 80;
      const ps = t.competencies?.find(c => c.name === "Problem Solving")?.score ?? 80;
      const ip = t.competencies?.find(c => c.name === "Interpersonal Skill")?.score ?? 80;

      const idp1 = t.idp?.[0];
      const idp2 = t.idp?.[1];

      const pe = t.performanceEvaluation || { fy2020: 3, fy2021: 3, fy2022: 3, fy2023: 3, fy2024: 4 };

      const perfDetails = calculateTalentPerformanceDetails(t);
      const placement = getTalentPlacement(t);
      const cellName = getCellName(placement.performance, placement.potential);
      const boxMatch = cellName.match(/Box\s*(\d+)/i);
      const boxNum = boxMatch ? parseInt(boxMatch[1]) : (t.squareOfTalent || 5);

      const pa = t.potentialAssessment || {
        kemampuanIntelektual: 2,
        berpikirKritis: 2,
        menyelesaikanMasalah: 2,
        belajarCepat: 2,
        kesadaranDiri: 2,
        interpersonal: 2,
        kecerdasanEmosional: 2,
        motivasiKomitmen: 2,
        businessKnowledge: 3,
        leadership: 3,
        problemSolving: 3,
        interpersonalSkill: 3,
        strategicMindset: 3,
        managesComplexity: 3,
        ensuresAccountability: 3,
        drivesVision: 3,
        cultivateInnovation: 3,
        studyBackgroundName: "Management",
        studyBackgroundScore: 2,
        targetLevel: "SM"
      };

      const trainingsStr = t.trainings && t.trainings.length > 0
        ? t.trainings.map(tr => `${tr.name} [${tr.type}]`).join("; ")
        : "";

      return [
        t.id,
        t.name,
        t.gender || "Laki-laki",
        t.nik || "",
        t.title,
        t.division,
        t.location,
        t.tenure,
        t.readiness,
        t.avatar || "",
        t.grade || "M4",
        t.birthDate || "1988-10-10",
        t.age ?? 38,
        t.joinDate || "2021-01-01",
        trainingsStr,
        pe.fy2020 ?? 3,
        pe.fy2021 ?? 3,
        pe.fy2022 ?? 3,
        pe.fy2023 ?? 3,
        pe.fy2024 ?? 4,
        t.customPerformance || "",
        t.customPotential || "",
        t.nineBoxNotes || "",
        lr,
        lp,
        ea,
        bk,
        ld,
        ps,
        ip,
        idp1?.title || "",
        idp1?.description || "",
        idp1?.progress ?? 0,
        idp2?.title || "",
        idp2?.description || "",
        idp2?.progress ?? 0,
        pa.kemampuanIntelektual ?? 2,
        pa.berpikirKritis ?? 2,
        pa.menyelesaikanMasalah ?? 2,
        pa.belajarCepat ?? 2,
        pa.kesadaranDiri ?? 2,
        pa.interpersonal ?? 2,
        pa.kecerdasanEmosional ?? 2,
        pa.motivasiKomitmen ?? 2,
        pa.businessKnowledge ?? 3,
        pa.leadership ?? 3,
        pa.problemSolving ?? 3,
        pa.interpersonalSkill ?? 3,
        pa.strategicMindset ?? 3,
        pa.managesComplexity ?? 3,
        pa.ensuresAccountability ?? 3,
        pa.drivesVision ?? 3,
        pa.cultivateInnovation ?? 3,
        pa.studyBackgroundName || "",
        pa.studyBackgroundScore ?? 2,
        pa.targetLevel || "SM",
        perfDetails.score50.toFixed(2),
        `${perfDetails.percentage.toFixed(1)}%`,
        perfDetails.code,
        perfDetails.categoryName,
        boxNum
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(val => {
          const s = String(val ?? "");
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Format_Database_Komite_Talent_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addSecurityLog("Format database berhasil diekspor ke berkas Excel/CSV.", "success");
  };

  const normalizeImportRowObject = (row: any) => {
    const getVal = (keys: string[], defaultVal: string = "") => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim();
        }
      }
      return defaultVal;
    };

    const getFloatVal = (keys: string[], defaultVal: number = 0) => {
      const str = getVal(keys);
      if (!str) return defaultVal;
      const parsed = parseFloat(str.replace(',', '.'));
      return isNaN(parsed) ? defaultVal : parsed;
    };

    const getIntVal = (keys: string[], defaultVal: number = 0) => {
      return Math.round(getFloatVal(keys, defaultVal));
    };

    return {
      rawId: getVal(["id", "ID", "id (kustom)"]),
      name: getVal(["name", "Nama Lengkap", "nama", "namalengkap", "Nama"]),
      gender: getVal(["gender", "Jenis Kelamin", "jeniskelamin", "JK", "sex"], "Laki-laki"),
      nik: getVal(["nik", "NIK Karyawan", "nikkaryawan", "employeeid", "nomorindukkaryawan"]),
      title: getVal(["title", "Jabatan", "jabatan", "posisi", "position"]),
      division: getVal(["division", "Department / Divisi", "Department", "department", "departemen", "divisi", "Divisi", "dept", "sektor"]),
      location: getVal(["location", "Lokasi Kerja", "Lokasi", "lokasi"]),
      tenure: getVal(["tenure", "Masa Kerja (Tenure)", "Masa Kerja", "masakerja"]),
      readiness: getVal(["readiness", "Kesiapan (READY NOW / READY 1-2 YEARS / READY 2+ YEARS)", "Kesiapan", "readinesslevel", "kesiapan"]),
      avatar: getVal(["avatar", "Avatar URL", "foto", "image"]),
      grade: getVal(["grade", "Grade (M5-M1 / ST5-ST1)", "Grade", "golongan"]),
      birthDate: getVal(["birthDate", "birthdate", "Tanggal Lahir (YYYY-MM-DD)", "Tanggal Lahir", "tanggallahir"]),
      age: getIntVal(["age", "Umur (Tahun)", "Umur", "umur", "usia"], 38),
      joinDate: getVal(["joinDate", "joindate", "Tanggal Masuk (YYYY-MM-DD)", "Tanggal Masuk", "tanggalmasuk"]),
      trainingsRaw: getVal(["trainings", "Pelatihan", "training", "Riwayat Pelatihan / Training", "sertifikasi", "Riwayat Pelatihan"]),
      
      fy2020: getFloatVal(["fy2020", "Kinerja Evaluation FY2020 (1-5)", "fy2020", "kinerja2020", "2020"], 0),
      fy2021: getFloatVal(["fy2021", "Kinerja Evaluation FY2021 (1-5)", "fy2021", "kinerja2021", "2021"], 0),
      fy2022: getFloatVal(["fy2022", "Kinerja Evaluation FY2022 (1-5)", "fy2022", "kinerja2022", "2022"], 0),
      fy2023: getFloatVal(["fy2023", "Kinerja Evaluation FY2023 (1-5)", "fy2023", "kinerja2023", "2023"], 0),
      fy2024: getFloatVal(["fy2024", "Kinerja Evaluation FY2024 (1-5)", "fy2024", "kinerja2024", "2024"], 0),

      customPerformance: getVal(["customPerformance", "customperformance", "Kustom Kinerja Nine-Box (Low / Medium / High)", "Kustom Kinerja Nine-Box"]),
      customPotential: getVal(["customPotential", "custompotential", "Kustom Potensi Nine-Box (Low / Medium / High)", "Kustom Potensi Nine-Box"]),
      nineBoxNotes: getVal(["nineBoxNotes", "nineboxnotes", "Catatan Evaluasi Nine-Box", "Catatan"]),

      logicalScore: getIntVal(["logicalScore", "logicalscore", "logical", "Skor Logical Reasoning (0-100)", "logicalReasoning"], 80),
      leadershipScore: getIntVal(["leadershipScore", "leadershipscore", "leadership", "Skor Leadership Potential (0-100)", "leadershipPotential"], 80),
      emotionalScore: getIntVal(["emotionalScore", "emotionalscore", "emotional", "Skor Emotional Agility (0-100)", "emotionalAgility"], 80),

      bkScore: getIntVal(["bkScore", "compBusinessKnowledge", "problemsolvingscore", "Kompetensi Business Knowledge (0-100)"], 80),
      ldScore: getIntVal(["ldScore", "compLeadership", "strategicscore", "Kompetensi Leadership (0-100)"], 80),
      psScore: getIntVal(["psScore", "compProblemSolving", "stakeholderscore", "Kompetensi Problem Solving (0-100)"], 80),
      ipScore: getIntVal(["ipScore", "compInterpersonal", "resultsscore", "Kompetensi Interpersonal Skill (0-100)"], 80),

      idp1Title: getVal(["idp1Title", "idptitle1", "IDP 1: Judul Program"]),
      idp1Desc: getVal(["idp1Desc", "idpdesc1", "IDP 1: Deskripsi"]),
      idp1Progress: getIntVal(["idp1Progress", "idpprogress1", "IDP 1: Progres (0-100)"], 30),

      idp2Title: getVal(["idp2Title", "idptitle2", "IDP 2: Judul Program"]),
      idp2Desc: getVal(["idp2Desc", "idpdesc2", "IDP 2: Deskripsi"]),
      idp2Progress: getIntVal(["idp2Progress", "idpprogress2", "IDP 2: Progres (0-100)"], 0),

      kemampuanIntelektual: getIntVal(["kemampuanIntelektual", "Asesmen Kemampuan Intelektual (1-3)"], 2),
      berpikirKritis: getIntVal(["berpikirKritis", "Asesmen Berpikir Kritis (1-3)"], 2),
      menyelesaikanMasalah: getIntVal(["menyelesaikanMasalah", "Asesmen Menyelesaikan Masalah (1-3)"], 2),
      belajarCepat: getIntVal(["belajarCepat", "Asesmen Belajar Cepat (1-3)"], 2),
      kesadaranDiri: getIntVal(["kesadaranDiri", "Asesmen Kesadaran Diri (1-3)"], 2),
      interpersonal: getIntVal(["interpersonal", "Asesmen Interpersonal (1-3)"], 2),
      kecerdasanEmosional: getIntVal(["kecerdasanEmosional", "Asesmen Kecerdasan Emosional (1-3)"], 2),
      motivasiKomitmen: getIntVal(["motivasiKomitmen", "Asesmen Motivasi & Komitmen (1-3)"], 2),

      stdBusinessKnowledge: getIntVal(["stdBusinessKnowledge", "businessKnowledge", "business_knowledge", "Business Knowledge", "Business Knowledge (1-5)", "Nilai Standar Business Knowledge (1-5)", "l. Business Knowledge", "l) Business Knowledge", "l_Business Knowledge", "compBusinessKnowledge"], 3),
      stdLeadership: getIntVal(["stdLeadership", "leadership", "Leadership", "Leadership (1-5)", "Nilai Standar Leadership (1-5)", "m. Leadership", "m) Leadership", "m_Leadership", "compLeadership"], 3),
      stdProblemSolving: getIntVal(["stdProblemSolving", "problemSolving", "problem_solving", "Problem Solving", "Problem Solving (1-5)", "Nilai Standar Problem Solving (1-5)", "n. Problem Solving", "n) Problem Solving", "n_Problem Solving", "compProblemSolving"], 3),
      stdInterpersonalSkill: getIntVal(["stdInterpersonalSkill", "interpersonalSkill", "interpersonal_skill", "Interpersonal Skill", "Interpersonal Skill (1-5)", "Nilai Standar Interpersonal Skill (1-5)", "o. Interpersonal Skill", "o) Interpersonal Skill", "o_Interpersonal Skill", "compInterpersonal"], 3),
      stdStrategicMindset: getIntVal(["stdStrategicMindset", "strategicMindset", "strategic_mindset", "Strategic Mindset", "Strategic Mindset (1-5)", "Nilai Standar Strategic Mindset (1-5)", "p. Strategic Mindset", "p) Strategic Mindset", "p_Strategic Mindset"], 3),
      stdManagesComplexity: getIntVal(["stdManagesComplexity", "managesComplexity", "manages_complexity", "Manages Complexity", "Manages Complexity (1-5)", "Nilai Standar Manages Complexity (1-5)", "q. Manages Complexity", "q) Manages Complexity", "q_Manages Complexity"], 3),
      stdEnsuresAccountability: getIntVal(["stdEnsuresAccountability", "ensuresAccountability", "ensures_accountability", "Ensures Accountability", "Ensures Accountability (1-5)", "Nilai Standar Ensures Accountability (1-5)", "r. Ensures Accountability", "r) Ensures Accountability", "r_Ensures Accountability"], 3),
      stdDrivesVision: getIntVal(["stdDrivesVision", "drivesVision", "drives_vision", "Drives Vision", "Drives Vision (1-5)", "Nilai Standar Drives Vision (1-5)", "s. Drives Vision", "s) Drives Vision", "s_Drives Vision"], 3),
      stdCultivateInnovation: getIntVal(["stdCultivateInnovation", "cultivateInnovation", "cultivate_innovation", "Cultivate Innovation", "Cultivate Innovation (1-5)", "Nilai Standar Cultivate Innovation (1-5)", "t. Cultivate Innovation", "t) Cultivate Innovation", "t_Cultivate Innovation"], 3),

      studyBackgroundName: getVal(["studyBackgroundName", "studybackgroundname", "Latar Belakang Studi (Nama)", "pendidikan"]),
      studyBackgroundScore: getIntVal(["studyBackgroundScore", "studybackgroundscore", "Latar Belakang Studi (Skor 1-3)", "poinpendidikan"], 3),
      targetLevel: getVal(["targetLevel", "Target Tingkat Jabatan (SM / DM)"], "SM")
    };
  };

  const processTalentImportRows = (rawText: string, fileType: "json" | "csv") => {
    let importedRows: any[] = [];
    
    if (fileType === "json") {
      try {
        const parsed = JSON.parse(rawText);
        const arrayRows = Array.isArray(parsed) ? parsed : [parsed];
        importedRows = arrayRows.map(row => normalizeImportRowObject(row));
      } catch (err: any) {
        throw new Error("Format JSON tidak valid: " + err.message);
      }
    } else {
      const parseCSVLines = (text: string): string[][] => {
        const lines: string[][] = [];
        let row: string[] = [];
        let insideQuote = false;
        let entry = "";
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];
          
          if (char === '"') {
            if (insideQuote && nextChar === '"') {
              entry += '"';
              i++;
            } else {
              insideQuote = !insideQuote;
            }
          } else if (char === ',' && !insideQuote) {
            row.push(entry.trim());
            entry = "";
          } else if ((char === '\r' || char === '\n') && !insideQuote) {
            if (char === '\r' && nextChar === '\n') {
              i++;
            }
            row.push(entry.trim());
            if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
              lines.push(row);
            }
            row = [];
            entry = "";
          } else {
            entry += char;
          }
        }
        if (entry !== "" || row.length > 0) {
          row.push(entry.trim());
          lines.push(row);
        }
        return lines;
      };

      const parsedRows = parseCSVLines(rawText);
      if (parsedRows.length <= 1) {
        throw new Error("Berkas CSV kosong atau tidak memiliki baris data.");
      }

      // Find real header row (ignoring decorative title rows)
      let headerRowIndex = parsedRows.findIndex(row => 
        row.some(cell => {
          const c = cell.trim().toLowerCase();
          return c === "nama" || c === "name" || c === "nik" || c === "position" || c === "no";
        })
      );
      if (headerRowIndex === -1) headerRowIndex = 0;

      const headerRow = parsedRows[headerRowIndex];
      const rawDataRows = parsedRows.slice(headerRowIndex + 1);

      // Filter out formula legend / descriptor rows
      const dataRows = rawDataRows.filter(row => {
        const rowStr = row.join(" ").toLowerCase();
        if (!rowStr.trim()) return false;
        if (rowStr.includes("a,b,c,d") || rowStr.includes("i : sum") || rowStr.includes("k : j * 40%") || rowStr.includes("nilai maximal") || rowStr.includes("standar psychotest")) return false;
        // Check if there is a name or valid NIK in the row
        return row.some(cell => cell.trim().length > 0);
      });

      const EXACT_HEADER_MAP: { [key: string]: string } = {
        "id": "id",
        "nama lengkap": "name",
        "jenis kelamin (laki-laki / perempuan)": "gender",
        "nik karyawan": "nik",
        "jabatan": "title",
        "department / divisi": "division",
        "lokasi kerja": "location",
        "masa kerja (tenure)": "tenure",
        "kesiapan (ready now / ready 1-2 years / ready 2+ years)": "readiness",
        "avatar url": "avatar",
        "grade (m5-m1 / st5-st1)": "grade",
        "tanggal lahir (yyyy-mm-dd)": "birthDate",
        "umur (tahun)": "age",
        "tanggal masuk (yyyy-mm-dd)": "joinDate",
        "riwayat pelatihan / training": "trainingsRaw",
        "kinerja evaluation fy2020 (1-5)": "fy2020",
        "kinerja evaluation fy2021 (1-5)": "fy2021",
        "kinerja evaluation fy2022 (1-5)": "fy2022",
        "kinerja evaluation fy2023 (1-5)": "fy2023",
        "kinerja evaluation fy2024 (1-5)": "fy2024",
        "kustom kinerja nine-box (low / medium / high)": "customPerformance",
        "kustom potensi nine-box (low / medium / high)": "customPotential",
        "catatan evaluasi nine-box": "nineBoxNotes",
        "skor logical reasoning (0-100)": "logicalReasoning",
        "skor leadership potential (0-100)": "leadershipPotential",
        "skor emotional agility (0-100)": "emotionalAgility",
        "kompetensi business knowledge (0-100)": "compBusinessKnowledge",
        "kompetensi leadership (0-100)": "compLeadership",
        "kompetensi problem solving (0-100)": "compProblemSolving",
        "kompetensi interpersonal skill (0-100)": "compInterpersonal",
        "idp 1: judul program": "idp1Title",
        "idp 1: deskripsi": "idp1Desc",
        "idp 1: progres (0-100)": "idp1Progress",
        "idp 2: judul program": "idp2Title",
        "idp 2: deskripsi": "idp2Desc",
        "idp 2: progres (0-100)": "idp2Progress",
        "asesmen kemampuan intelektual (1-3)": "kemampuanIntelektual",
        "asesmen berpikir kritis (1-3)": "berpikirKritis",
        "asesmen menyelesaikan masalah (1-3)": "menyelesaikanMasalah",
        "asesmen belajar cepat (1-3)": "belajarCepat",
        "asesmen kesadaran diri (1-3)": "kesadaranDiri",
        "asesmen interpersonal (1-3)": "interpersonal",
        "asesmen kecerdasan emosional (1-3)": "kecerdasanEmosional",
        "asesmen motivasi & komitmen (1-3)": "motivasiKomitmen",
        "nilai standar business knowledge (1-5)": "stdBusinessKnowledge",
        "nilai standar leadership (1-5)": "stdLeadership",
        "nilai standar problem solving (1-5)": "stdProblemSolving",
        "nilai standar interpersonal skill (1-5)": "stdInterpersonalSkill",
        "nilai standar strategic mindset (1-5)": "stdStrategicMindset",
        "nilai standar manages complexity (1-5)": "stdManagesComplexity",
        "nilai standar ensures accountability (1-5)": "stdEnsuresAccountability",
        "nilai standar drives vision (1-5)": "stdDrivesVision",
        "nilai standar cultivate innovation (1-5)": "stdCultivateInnovation",
        "latar belakang studi (nama)": "studyBackgroundName",
        "latar belakang studi (skor 1-3)": "studyBackgroundScore",
        "target tingkat jabatan (sm / dm)": "targetLevel",
        "nilai evaluasi kinerja (sumbu y 12.5-50.0)": "evaluasiScore",
        "kode kategori evaluasi (1=rendah, 2=sedang, 3=tinggi)": "evaluasiCode",
        "kategori evaluasi kinerja": "evaluasiCategory",
        "nomor kotak nine-box (1-9)": "squareOfTalent"
      };

      const headerMap: { [key: string]: number } = {};
      headerRow.forEach((headerName, idx) => {
        const cleanHeader = headerName.trim().toLowerCase();
        
        if (EXACT_HEADER_MAP[cleanHeader]) {
          headerMap[EXACT_HEADER_MAP[cleanHeader]] = idx;
        } else if (cleanHeader === "id" || cleanHeader === "rawid" || cleanHeader.includes("id (")) {
          headerMap["id"] = idx;
        } else if (
          cleanHeader === "nama lengkap" || 
          cleanHeader === "nama" || 
          cleanHeader === "name" || 
          cleanHeader === "full name" || 
          cleanHeader === "fullname" || 
          cleanHeader === "nama karyawan" ||
          ((cleanHeader.includes("nama") || cleanHeader.includes("name")) && 
           !cleanHeader.includes("studi") && 
           !cleanHeader.includes("study") && 
           !cleanHeader.includes("idp") && 
           !cleanHeader.includes("program") && 
           !cleanHeader.includes("kategori"))
        ) {
          headerMap["name"] = idx;
        } else if (cleanHeader.includes("jenis kelamin") || cleanHeader.includes("gender") || cleanHeader === "jk" || cleanHeader === "sex") {
          headerMap["gender"] = idx;
        } else if (cleanHeader.includes("nik") || cleanHeader.includes("nomor induk") || cleanHeader.includes("employee id") || cleanHeader.includes("employeeid")) {
          headerMap["nik"] = idx;
        } else if (cleanHeader.includes("jabatan") || cleanHeader === "position" || cleanHeader === "title" || cleanHeader.includes("posisi")) {
          headerMap["title"] = idx;
        } else if (cleanHeader.includes("department") || cleanHeader.includes("departemen") || cleanHeader.includes("divisi") || cleanHeader.includes("division") || cleanHeader.includes("dept") || cleanHeader.includes("sektor")) {
          headerMap["division"] = idx;
        } else if (cleanHeader.includes("lokasi") || cleanHeader.includes("location") || cleanHeader.includes("base")) {
          headerMap["location"] = idx;
        } else if (cleanHeader.includes("masa kerja") || cleanHeader.includes("tenure") || cleanHeader.includes("masakerja")) {
          headerMap["tenure"] = idx;
        } else if (cleanHeader.includes("kesiapan") || cleanHeader.includes("readiness")) {
          headerMap["readiness"] = idx;
        } else if (cleanHeader.includes("avatar") || cleanHeader.includes("foto") || cleanHeader.includes("image")) {
          headerMap["avatar"] = idx;
        } else if (cleanHeader.includes("grade") || cleanHeader.includes("golongan")) {
          headerMap["grade"] = idx;
        } else if (cleanHeader.includes("tanggal lahir") || cleanHeader.includes("birth date") || cleanHeader.includes("birthdate") || cleanHeader.includes("tanggallahir")) {
          headerMap["birthDate"] = idx;
        } else if (cleanHeader.includes("umur") || cleanHeader.includes("age") || cleanHeader.includes("usia")) {
          headerMap["age"] = idx;
        } else if (cleanHeader.includes("tanggal masuk") || cleanHeader.includes("join date") || cleanHeader.includes("joindate") || cleanHeader.includes("tanggalmasuk")) {
          headerMap["joinDate"] = idx;
        } else if (cleanHeader.includes("training") || cleanHeader.includes("pelatihan") || cleanHeader.includes("sertifikasi")) {
          headerMap["trainingsRaw"] = idx;
        } else if (cleanHeader.includes("fy2020") || (cleanHeader.includes("2020") && cleanHeader.includes("kinerja"))) {
          headerMap["fy2020"] = idx;
        } else if (cleanHeader.includes("fy2021") || (cleanHeader.includes("2021") && cleanHeader.includes("kinerja"))) {
          headerMap["fy2021"] = idx;
        } else if (cleanHeader.includes("fy2022") || (cleanHeader.includes("2022") && cleanHeader.includes("kinerja"))) {
          headerMap["fy2022"] = idx;
        } else if (cleanHeader.includes("fy2023") || (cleanHeader.includes("2023") && cleanHeader.includes("kinerja"))) {
          headerMap["fy2023"] = idx;
        } else if (cleanHeader.includes("fy2024") || (cleanHeader.includes("2024") && cleanHeader.includes("kinerja"))) {
          headerMap["fy2024"] = idx;
        } else if (cleanHeader.includes("kustom kinerja") || cleanHeader.includes("custom performance") || cleanHeader.includes("customperformance")) {
          headerMap["customPerformance"] = idx;
        } else if (cleanHeader.includes("kustom potensi") || cleanHeader.includes("custom potential") || cleanHeader.includes("custompotential")) {
          headerMap["customPotential"] = idx;
        } else if (cleanHeader.includes("catatan") || cleanHeader.includes("notes") || cleanHeader.includes("nineboxnotes")) {
          headerMap["nineBoxNotes"] = idx;
        } else if (cleanHeader.includes("logical reasoning") || cleanHeader.includes("logicalscore") || cleanHeader === "logical") {
          headerMap["logicalReasoning"] = idx;
        } else if (cleanHeader.includes("leadership potential") || cleanHeader.includes("leadershipscore")) {
          headerMap["leadershipPotential"] = idx;
        } else if (cleanHeader.includes("emotional agility") || cleanHeader.includes("emotionalscore")) {
          headerMap["emotionalAgility"] = idx;
        } else if (cleanHeader.includes("kompetensi business knowledge") || (cleanHeader.includes("business knowledge") && !cleanHeader.includes("standar") && !cleanHeader.includes("nilai") && !cleanHeader.includes("potential"))) {
          headerMap["compBusinessKnowledge"] = idx;
        } else if (cleanHeader.includes("kompetensi leadership") || (cleanHeader.includes("leadership") && !cleanHeader.includes("standar") && !cleanHeader.includes("nilai") && !cleanHeader.includes("potential"))) {
          headerMap["compLeadership"] = idx;
        } else if (cleanHeader.includes("kompetensi problem solving") || (cleanHeader.includes("problem solving") && !cleanHeader.includes("standar") && !cleanHeader.includes("nilai") && !cleanHeader.includes("potential"))) {
          headerMap["compProblemSolving"] = idx;
        } else if (cleanHeader.includes("kompetensi interpersonal") || (cleanHeader.includes("interpersonal skill") && !cleanHeader.includes("standar") && !cleanHeader.includes("nilai") && !cleanHeader.includes("potential"))) {
          headerMap["compInterpersonal"] = idx;
        } else if (cleanHeader.includes("idp 1") && (cleanHeader.includes("judul") || cleanHeader.includes("title"))) {
          headerMap["idp1Title"] = idx;
        } else if (cleanHeader.includes("idp 1") && (cleanHeader.includes("deskripsi") || cleanHeader.includes("desc"))) {
          headerMap["idp1Desc"] = idx;
        } else if (cleanHeader.includes("idp 1") && (cleanHeader.includes("progres") || cleanHeader.includes("progress"))) {
          headerMap["idp1Progress"] = idx;
        } else if (cleanHeader.includes("idp 2") && (cleanHeader.includes("judul") || cleanHeader.includes("title"))) {
          headerMap["idp2Title"] = idx;
        } else if (cleanHeader.includes("idp 2") && (cleanHeader.includes("deskripsi") || cleanHeader.includes("desc"))) {
          headerMap["idp2Desc"] = idx;
        } else if (cleanHeader.includes("idp 2") && (cleanHeader.includes("progres") || cleanHeader.includes("progress"))) {
          headerMap["idp2Progress"] = idx;
        } else if (cleanHeader.includes("kemampuan intelektual")) {
          headerMap["kemampuanIntelektual"] = idx;
        } else if (cleanHeader.includes("berpikir kritis")) {
          headerMap["berpikirKritis"] = idx;
        } else if (cleanHeader.includes("menyelesaikan masalah") || cleanHeader.includes("menyelesaikan permasalahan")) {
          headerMap["menyelesaikanMasalah"] = idx;
        } else if (cleanHeader.includes("belajar cepat")) {
          headerMap["belajarCepat"] = idx;
        } else if (cleanHeader.includes("kesadaran diri")) {
          headerMap["kesadaranDiri"] = idx;
        } else if (cleanHeader.includes("asesmen interpersonal") || (cleanHeader.includes("interpersonal") && cleanHeader.includes("asesmen"))) {
          headerMap["interpersonal"] = idx;
        } else if (cleanHeader.includes("kecerdasan emosional")) {
          headerMap["kecerdasanEmosional"] = idx;
        } else if (cleanHeader.includes("motivasi")) {
          headerMap["motivasiKomitmen"] = idx;
        } else if (cleanHeader.includes("nilai standar business knowledge") || (cleanHeader.includes("business knowledge") && cleanHeader.includes("standar"))) {
          headerMap["stdBusinessKnowledge"] = idx;
        } else if (cleanHeader.includes("nilai standar leadership") || (cleanHeader.includes("leadership") && cleanHeader.includes("standar"))) {
          headerMap["stdLeadership"] = idx;
        } else if (cleanHeader.includes("nilai standar problem solving") || (cleanHeader.includes("problem solving") && cleanHeader.includes("standar"))) {
          headerMap["stdProblemSolving"] = idx;
        } else if (cleanHeader.includes("nilai standar interpersonal") || (cleanHeader.includes("interpersonal") && cleanHeader.includes("standar"))) {
          headerMap["stdInterpersonalSkill"] = idx;
        } else if (cleanHeader.includes("strategic mindset")) {
          headerMap["stdStrategicMindset"] = idx;
        } else if (cleanHeader.includes("manages complexity")) {
          headerMap["stdManagesComplexity"] = idx;
        } else if (cleanHeader.includes("ensures accountability")) {
          headerMap["stdEnsuresAccountability"] = idx;
        } else if (cleanHeader.includes("drives vision")) {
          headerMap["stdDrivesVision"] = idx;
        } else if (cleanHeader.includes("cultivate innovation")) {
          headerMap["stdCultivateInnovation"] = idx;
        } else if (cleanHeader.includes("latar belakang studi") && (cleanHeader.includes("nama") || !cleanHeader.includes("skor"))) {
          headerMap["studyBackgroundName"] = idx;
        } else if (cleanHeader.includes("latar belakang studi") && cleanHeader.includes("skor")) {
          headerMap["studyBackgroundScore"] = idx;
        } else if (cleanHeader.includes("study background") && !cleanHeader.includes("assessment") && !cleanHeader.includes("skor") && !cleanHeader.includes("score")) {
          headerMap["studyBackgroundName"] = idx;
        } else if (cleanHeader.includes("assessment study background") || (cleanHeader.includes("study background") && (cleanHeader.includes("skor") || cleanHeader.includes("score")))) {
          headerMap["studyBackgroundScore"] = idx;
        } else if (cleanHeader.includes("target tingkat jabatan") || cleanHeader.includes("target level")) {
          headerMap["targetLevel"] = idx;
        } else if (cleanHeader.includes("nilai evaluasi kinerja") || cleanHeader.includes("sumbu y")) {
          headerMap["evaluasiScore"] = idx;
        } else if (cleanHeader.includes("kode kategori evaluasi") || cleanHeader.includes("kode evaluasi") || cleanHeader.includes("evaluation_code")) {
          headerMap["evaluasiCode"] = idx;
        } else if (cleanHeader.includes("kategori evaluasi kinerja") || (cleanHeader.includes("kategori evaluasi") && !cleanHeader.includes("kode"))) {
          headerMap["evaluasiCategory"] = idx;
        } else if (cleanHeader.includes("nomor kotak nine-box") || cleanHeader.includes("square of talent") || cleanHeader.includes("square_of_talent") || cleanHeader.includes("nomor kotak")) {
          headerMap["squareOfTalent"] = idx;
        }
      });

      dataRows.forEach(row => {
        const getVal = (key: string, defaultVal: string = ""): string => {
          const idx = headerMap[key];
          if (idx === undefined || idx >= row.length) return defaultVal;
          return (row[idx] ?? defaultVal).trim();
        };

        const getFloatVal = (key: string, defaultVal: number = 0): number => {
          const val = getVal(key);
          if (!val) return defaultVal;
          const parsed = parseFloat(val.replace(',', '.'));
          return isNaN(parsed) ? defaultVal : parsed;
        };

        const getIntVal = (key: string, defaultVal: number = 0): number => {
          return Math.round(getFloatVal(key, defaultVal));
        };

        importedRows.push({
          rawId: getVal("id"),
          name: getVal("name"),
          gender: getVal("gender", "Laki-laki"),
          nik: getVal("nik"),
          title: getVal("title", "Managerial Staff"),
          division: getVal("division", "Technology Dept."),
          location: getVal("location", "Jakarta HQ"),
          tenure: getVal("tenure", "3 Years"),
          readiness: getVal("readiness", "READY 1-2 YEARS"),
          avatar: getVal("avatar"),
          grade: getVal("grade", "M4"),
          birthDate: getVal("birthDate", "1988-10-10"),
          age: getIntVal("age", 38),
          joinDate: getVal("joinDate", "2021-01-01"),
          trainingsRaw: getVal("trainingsRaw"),
          fy2020: getFloatVal("fy2020", 0),
          fy2021: getFloatVal("fy2021", 0),
          fy2022: getFloatVal("fy2022", 0),
          fy2023: getFloatVal("fy2023", 0),
          fy2024: getFloatVal("fy2024", 0),
          customPerformance: getVal("customPerformance"),
          customPotential: getVal("customPotential"),
          nineBoxNotes: getVal("nineBoxNotes"),
          logicalScore: getIntVal("logicalReasoning", 80),
          leadershipScore: getIntVal("leadershipPotential", 80),
          emotionalScore: getIntVal("emotionalAgility", 80),
          bkScore: getIntVal("compBusinessKnowledge", 80),
          ldScore: getIntVal("compLeadership", 80),
          psScore: getIntVal("compProblemSolving", 80),
          ipScore: getIntVal("compInterpersonal", 80),
          idp1Title: getVal("idp1Title", "Strategic Leadership Program"),
          idp1Desc: getVal("idp1Desc", "Advanced coaching on business strategy and scaling regional operations."),
          idp1Progress: getIntVal("idp1Progress", 30),
          idp2Title: getVal("idp2Title", "Data-Driven Decision Making"),
          idp2Desc: getVal("idp2Desc", "Focusing on big data analytics and practical predictive insights."),
          idp2Progress: getIntVal("idp2Progress", 0),
          kemampuanIntelektual: getFloatVal("kemampuanIntelektual", 3),
          berpikirKritis: getFloatVal("berpikirKritis", 3),
          menyelesaikanMasalah: getFloatVal("menyelesaikanMasalah", 3),
          belajarCepat: getFloatVal("belajarCepat", 3),
          kesadaranDiri: getFloatVal("kesadaranDiri", 3),
          interpersonal: getFloatVal("interpersonal", 3),
          kecerdasanEmosional: getFloatVal("kecerdasanEmosional", 3),
          motivasiKomitmen: getFloatVal("motivasiKomitmen", 3),
          stdBusinessKnowledge: getFloatVal("stdBusinessKnowledge", 1),
          stdLeadership: getFloatVal("stdLeadership", 1),
          stdProblemSolving: getFloatVal("stdProblemSolving", 1),
          stdInterpersonalSkill: getFloatVal("stdInterpersonalSkill", 1),
          stdStrategicMindset: getFloatVal("stdStrategicMindset", 1),
          stdManagesComplexity: getFloatVal("stdManagesComplexity", 1),
          stdEnsuresAccountability: getFloatVal("stdEnsuresAccountability", 1),
          stdDrivesVision: getFloatVal("stdDrivesVision", 1),
          stdCultivateInnovation: getFloatVal("stdCultivateInnovation", 1),
          studyBackgroundName: getVal("studyBackgroundName", "S1"),
          studyBackgroundScore: getFloatVal("studyBackgroundScore", 3),
          targetLevel: getVal("targetLevel", "SM"),
          evaluasiScore: getFloatVal("evaluasiScore", 0),
          evaluasiCode: getIntVal("evaluasiCode", 0),
          evaluasiCategory: getVal("evaluasiCategory"),
          squareOfTalent: getIntVal("squareOfTalent", 0)
        });
      });
    }

    if (importedRows.length === 0) {
      throw new Error("Tidak ada data talenta yang dapat diimpor.");
    }

    let updatedCount = 0;
    let createdCount = 0;

    const currentList = [...talents];

    importedRows.forEach((row) => {
      const name = row.name || "";
      if (!name.trim()) return;

      const rawId = row.rawId || row.id;
      const id = rawId ? rawId.trim() : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      const title = row.title || "Managerial Staff";
      const division = row.division || row.department || row.divisi || "Technology Dept.";
      const location = row.location || "Jakarta HQ";
      const tenure = row.tenure || "3 Years";
      const readiness = (row.readiness || "READY 1-2 YEARS").toUpperCase();
      const avatar = row.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      
      const gender = (row.gender === "Perempuan" || row.gender?.toLowerCase().includes("perempuan") || row.gender?.toLowerCase() === "f" || row.gender?.toLowerCase() === "p") ? "Perempuan" : "Laki-laki";
      const nik = row.nik || "";
      const grade = row.grade || "M4";
      const birthDate = row.birthDate || "1988-10-10";
      const age = Number(row.age || 38);
      const joinDate = row.joinDate || "2021-01-01";

      const fy2020 = Math.max(0, Number(row.fy2020 || 0));
      const fy2021 = Math.max(0, Number(row.fy2021 || 0));
      const fy2022 = Math.max(0, Number(row.fy2022 || 0));
      const fy2023 = Math.max(0, Number(row.fy2023 || 0));
      const fy2024 = Math.max(0, Number(row.fy2024 || 0));

      const customPerfRaw = row.customPerformance;
      const customPerformance = (customPerfRaw === "Low" || customPerfRaw === "Medium" || customPerfRaw === "High") ? customPerfRaw : undefined;
      
      const customPotRaw = row.customPotential;
      const customPotential = (customPotRaw === "Low" || customPotRaw === "Medium" || customPotRaw === "High") ? customPotRaw : undefined;
      
      const nineBoxNotes = row.nineBoxNotes || undefined;

      const lrScore = Math.min(100, Math.max(0, Number(row.logicalScore || 80)));
      const lpScore = Math.min(100, Math.max(0, Number(row.leadershipScore || 80)));
      const eaScore = Math.min(100, Math.max(0, Number(row.emotionalScore || 80)));

      const bkScore = Math.min(100, Math.max(0, Number(row.bkScore || 80)));
      const ldScore = Math.min(100, Math.max(0, Number(row.ldScore || 80)));
      const psScore = Math.min(100, Math.max(0, Number(row.psScore || 80)));
      const ipScore = Math.min(100, Math.max(0, Number(row.ipScore || 80)));

      let readinessColor: "emerald" | "amber" | "rose" | "teal" = "amber";
      if (readiness.includes("NOW")) readinessColor = "emerald";
      else if (readiness.includes("2+")) readinessColor = "rose";

      const getCompetencyLabel = (sc: number) => {
        const lvl = sc >= 80 ? 'Expert' : sc >= 60 ? 'Advanced' : 'Proficient';
        return `${lvl} (${(sc/20).toFixed(1)}/5)`;
      };

      const competencies = [
        { name: "Business Knowledge", score: bkScore, label: getCompetencyLabel(bkScore) },
        { name: "Leadership", score: ldScore, label: getCompetencyLabel(ldScore) },
        { name: "Problem Solving", score: psScore, label: getCompetencyLabel(psScore) },
        { name: "Interpersonal Skill", score: ipScore, label: getCompetencyLabel(ipScore) }
      ];

      const idp1Title = row.idp1Title || "Strategic Leadership Program";
      const idp1Desc = row.idp1Desc || "Advanced coaching on business strategy and scaling regional operations.";
      const idp1Progress = Math.min(100, Math.max(0, Number(row.idp1Progress || 30)));
      
      const idp2Title = row.idp2Title || "Data-Driven Decision Making";
      const idp2Desc = row.idp2Desc || "Focusing on big data analytics and practical predictive insights.";
      const idp2Progress = Math.min(100, Math.max(0, Number(row.idp2Progress || 0)));

      const idp = [
        {
          title: idp1Title,
          status: idp1Progress === 100 ? "Completed" : idp1Progress > 0 ? "In Progress" : "Not Started" as any,
          description: idp1Desc,
          progress: idp1Progress
        },
        {
          title: idp2Title,
          status: idp2Progress === 100 ? "Completed" : idp2Progress > 0 ? "In Progress" : "Not Started" as any,
          description: idp2Desc,
          progress: idp2Progress
        }
      ];

      const potentialAssessment = {
        kemampuanIntelektual: Math.min(3, Math.max(1, Number(row.kemampuanIntelektual || 2))),
        berpikirKritis: Math.min(3, Math.max(1, Number(row.berpikirKritis || 2))),
        menyelesaikanMasalah: Math.min(3, Math.max(1, Number(row.menyelesaikanMasalah || 2))),
        belajarCepat: Math.min(3, Math.max(1, Number(row.belajarCepat || 2))),
        kesadaranDiri: Math.min(3, Math.max(1, Number(row.kesadaranDiri || 2))),
        interpersonal: Math.min(3, Math.max(1, Number(row.interpersonal || 2))),
        kecerdasanEmosional: Math.min(3, Math.max(1, Number(row.kecerdasanEmosional || 2))),
        motivasiKomitmen: Math.min(3, Math.max(1, Number(row.motivasiKomitmen || 2))),
        businessKnowledge: Math.min(5, Math.max(1, Number(row.stdBusinessKnowledge || 3))),
        leadership: Math.min(5, Math.max(1, Number(row.stdLeadership || 3))),
        problemSolving: Math.min(5, Math.max(1, Number(row.stdProblemSolving || 3))),
        interpersonalSkill: Math.min(5, Math.max(1, Number(row.stdInterpersonalSkill || 3))),
        strategicMindset: Math.min(5, Math.max(1, Number(row.stdStrategicMindset || 3))),
        managesComplexity: Math.min(5, Math.max(1, Number(row.stdManagesComplexity || 3))),
        ensuresAccountability: Math.min(5, Math.max(1, Number(row.stdEnsuresAccountability || 3))),
        drivesVision: Math.min(5, Math.max(1, Number(row.stdDrivesVision || 3))),
        cultivateInnovation: Math.min(5, Math.max(1, Number(row.stdCultivateInnovation || 3))),
        studyBackgroundName: row.studyBackgroundName || "S1 Teknik Industri",
        studyBackgroundScore: Math.min(3, Math.max(1, Number(row.studyBackgroundScore || 3))),
        targetLevel: ((row.targetLevel || "SM").toUpperCase() === "DM" ? "DM" : "SM") as "SM" | "DM"
      };

      const performanceEvaluation = {
        fy2020,
        fy2021,
        fy2022,
        fy2023,
        fy2024
      };

      const existingIndex = currentList.findIndex(t => t.id === id || t.name.toLowerCase().trim() === name.toLowerCase().trim());
      const existing = existingIndex > -1 ? currentList[existingIndex] : undefined;

      let trainingsList: TrainingItem[] = existing?.trainings || [];
      if (row.trainingsRaw) {
        if (Array.isArray(row.trainingsRaw)) {
          trainingsList = row.trainingsRaw;
        } else if (typeof row.trainingsRaw === "string" && row.trainingsRaw.trim()) {
          const items = row.trainingsRaw.split(";").map((s: string) => s.trim()).filter(Boolean);
          trainingsList = items.map((item: string, idx: number) => {
            const match = item.match(/^(.*?)(?:\s*\[(.*?)\])?$/);
            const tName = match ? match[1].trim() : item;
            const typeRaw = match && match[2] ? match[2].trim() : "Leadership";
            const validTypes = ["Leadership", "Technical", "Management", "Certification"];
            const tType = validTypes.includes(typeRaw) ? (typeRaw as any) : "Leadership";
            return {
              id: `tr-imp-${Date.now()}-${idx}`,
              name: tName,
              provider: "Internal / Imported",
              date: new Date().toISOString().slice(0, 10),
              type: tType,
              status: "Completed" as const
            };
          });
        }
      }

      if (existingIndex > -1 && existing) {
        currentList[existingIndex] = {
          ...existing,
          name,
          gender,
          title,
          division,
          location,
          tenure,
          readiness,
          readinessColor,
          avatar: avatar || existing.avatar,
          nik: nik || existing.nik,
          grade: grade || existing.grade,
          birthDate: birthDate || existing.birthDate,
          age: age !== undefined ? age : existing.age,
          joinDate: joinDate || existing.joinDate,
          customPerformance: customPerformance || existing.customPerformance,
          customPotential: customPotential || existing.customPotential,
          nineBoxNotes: nineBoxNotes || existing.nineBoxNotes,
          performanceEvaluation,
          importedEvaluasiScore: row.evaluasiScore > 0 ? row.evaluasiScore : existing.importedEvaluasiScore,
          importedEvaluasiCode: row.evaluasiCode > 0 ? row.evaluasiCode : existing.importedEvaluasiCode,
          importedEvaluasiCategory: row.evaluasiCategory || existing.importedEvaluasiCategory,
          squareOfTalent: row.squareOfTalent > 0 ? row.squareOfTalent : existing.squareOfTalent,
          psychometric: {
            logicalReasoning: { name: "LOGICAL REASONING", score: lrScore, description: existing.psychometric?.logicalReasoning?.description || "Analytical ability." },
            leadershipPotential: { name: "LEADERSHIP POTENTIAL", score: lpScore, description: existing.psychometric?.leadershipPotential?.description || "Leadership drive." },
            emotionalAgility: { name: "EMOTIONAL AGILITY", score: eaScore, description: existing.psychometric?.emotionalAgility?.description || "Adaptive capabilities." }
          },
          competencies,
          idp,
          trainings: trainingsList,
          potentialAssessment
        };
        updatedCount++;
      } else {
        const newTalentObj: TalentProfile = {
          id,
          name,
          gender,
          title,
          division,
          location,
          tenure,
          readiness,
          readinessColor,
          avatar,
          nik,
          grade,
          birthDate,
          age,
          joinDate,
          customPerformance,
          customPotential,
          nineBoxNotes,
          performanceEvaluation,
          importedEvaluasiScore: row.evaluasiScore > 0 ? row.evaluasiScore : undefined,
          importedEvaluasiCode: row.evaluasiCode > 0 ? row.evaluasiCode : undefined,
          importedEvaluasiCategory: row.evaluasiCategory || undefined,
          squareOfTalent: row.squareOfTalent > 0 ? row.squareOfTalent : undefined,
          psychometric: {
            logicalReasoning: { name: "LOGICAL REASONING", score: lrScore, description: "Analytical ability." },
            leadershipPotential: { name: "LEADERSHIP POTENTIAL", score: lpScore, description: "Leadership drive." },
            emotionalAgility: { name: "EMOTIONAL AGILITY", score: eaScore, description: "Adaptive capabilities." }
          },
          competencies,
          idp,
          trainings: trainingsList,
          potentialAssessment
        };
        currentList.push(newTalentObj);
        createdCount++;
      }
    });

    setTalents(currentList);
    return { updatedCount, createdCount };
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const res = processTalentImportRows(text, "csv");
        addSecurityLog(`Impor CSV berhasil: ${res.updatedCount} talent diperbarui, ${res.createdCount} talent baru ditambahkan.`, "success");
        alert(`Impor data talent berhasil!\n\n- ${res.updatedCount} Talent Diperbarui\n- ${res.createdCount} Talent Baru Ditambahkan\n\nSeluruh data (termasuk Department, Skor & Evaluasi) telah disinkronkan secara penuh dengan sistem.`);
      } catch (err: any) {
        alert("Gagal membaca atau memproses berkas CSV: " + err.message);
        addSecurityLog("Gagal memproses berkas CSV yang diimpor.", "warning");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Export and Import handlers for Peta Suksesi & Manajemen Masa Pensiun
  const handleExportRetiringPositionsJSON = () => {
    const exportData = {
      appName: "PT Ajinomoto Indonesia - Peta Suksesi & Manajemen Masa Pensiun",
      exportedAt: new Date().toISOString(),
      version: "2.5.0",
      totalPositions: retiringPositions.length,
      retiringPositions: retiringPositions.map(pos => {
        const assignedTalent = talents.find(t => t.id === pos.assignedSuccessorId);
        return {
          ...pos,
          assignedSuccessorName: assignedTalent ? assignedTalent.name : null,
          assignedSuccessorTitle: assignedTalent ? assignedTalent.title : null,
          assignedSuccessorReadiness: assignedTalent ? assignedTalent.readiness : null
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `peta_suksesi_pensiun_ajinomoto_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addSecurityLog("Data Peta Suksesi & Masa Pensiun berhasil diekspor ke format JSON.", "success");
  };

  const handleExportRetiringPositionsCSV = () => {
    const headers = [
      "ID Posisi",
      "Nama Posisi Pensiun",
      "Petahana Saat Ini",
      "Tanggal Rencana Pensiun",
      "Divisi / Departemen",
      "Tingkat Urgensi (High / Medium / Low)",
      "Target Kompetensi Utama",
      "ID Suksesor Terpilih",
      "Nama Suksesor Terpilih",
      "Kesiapan Suksesor",
      "Status Kesesuaian (Primary / Secondary / Emergency)"
    ];

    const rows = retiringPositions.map(pos => {
      const assignedTalent = talents.find(t => t.id === pos.assignedSuccessorId);
      return [
        pos.id,
        pos.positionName,
        pos.currentIncumbent,
        pos.retirementDate,
        pos.division,
        pos.urgency,
        pos.targetCompetencies ? pos.targetCompetencies.join("; ") : "",
        pos.assignedSuccessorId || "",
        assignedTalent ? assignedTalent.name : "Belum Ada Suksesor",
        assignedTalent ? assignedTalent.readiness : "N/A",
        pos.suitabilityStatus || "Primary"
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        row.map(val => {
          const s = String(val ?? "");
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `peta_suksesi_pensiun_ajinomoto_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addSecurityLog("Data Peta Suksesi & Masa Pensiun berhasil diekspor ke format CSV / Excel.", "success");
  };

  const handleImportRetiringPositionsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) throw new Error("Berkas kosong.");

        let importedPositions: RetiringPosition[] = [];

        if (file.name.toLowerCase().endsWith(".json")) {
          const parsed = JSON.parse(content);
          const rawArray = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.retiringPositions)
            ? parsed.retiringPositions
            : [parsed];

          importedPositions = rawArray.map((item: any, idx: number) => ({
            id: item.id || `pos-${Date.now()}-${idx}`,
            positionName: item.positionName || item["Nama Posisi Pensiun"] || item["posisi"] || "Posisi Pensiun",
            currentIncumbent: item.currentIncumbent || item["Petahana Saat Ini"] || item["petahana"] || "Petahana",
            retirementDate: item.retirementDate || item["Tanggal Rencana Pensiun"] || item["pensiun"] || "2026-12-31",
            division: item.division || item["Divisi / Departemen"] || item["divisi"] || "General Affairs",
            urgency: (item.urgency || item["Tingkat Urgensi"]) === "High" ? "High" : (item.urgency || item["Tingkat Urgensi"]) === "Low" ? "Low" : "Medium",
            targetCompetencies: Array.isArray(item.targetCompetencies)
              ? item.targetCompetencies
              : typeof item.targetCompetencies === "string"
              ? item.targetCompetencies.split(";").map((s: string) => s.trim())
              : ["Leadership", "Problem Solving"],
            assignedSuccessorId: item.assignedSuccessorId || item["ID Suksesor Terpilih"] || undefined,
            suitabilityStatus: item.suitabilityStatus || item["Status Kesesuaian"] || "Primary"
          }));
        } else if (file.name.toLowerCase().endsWith(".csv") || file.name.toLowerCase().endsWith(".txt")) {
          const parseCSVLines = (text: string): string[][] => {
            const lines: string[][] = [];
            let row: string[] = [];
            let insideQuote = false;
            let entry = "";
            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              const nextChar = text[i + 1];
              if (char === '"') {
                if (insideQuote && nextChar === '"') {
                  entry += '"';
                  i++;
                } else {
                  insideQuote = !insideQuote;
                }
              } else if (char === ',' && !insideQuote) {
                row.push(entry.trim());
                entry = "";
              } else if ((char === '\r' || char === '\n') && !insideQuote) {
                if (char === '\r' && nextChar === '\n') i++;
                row.push(entry.trim());
                if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
                  lines.push(row);
                }
                row = [];
                entry = "";
              } else {
                entry += char;
              }
            }
            if (entry !== "" || row.length > 0) {
              row.push(entry.trim());
              lines.push(row);
            }
            return lines;
          };

          const parsedRows = parseCSVLines(content);
          if (parsedRows.length <= 1) {
            throw new Error("Berkas CSV tidak memiliki baris data.");
          }

          const headerRow = parsedRows[0].map(h => h.trim().toLowerCase());
          const dataRows = parsedRows.slice(1);

          const findColIdx = (keywords: string[]) => {
            return headerRow.findIndex(h => keywords.some(k => h.includes(k)));
          };

          const idIdx = findColIdx(["id posisi", "id", "posisi id"]);
          const nameIdx = findColIdx(["nama posisi", "posisi pensiun", "positionname", "posisi"]);
          const incumbentIdx = findColIdx(["petahana", "incumbent", "pejabat"]);
          const dateIdx = findColIdx(["tanggal", "pensiun", "retirementdate", "date"]);
          const divIdx = findColIdx(["divisi", "departemen", "division", "dept"]);
          const urgencyIdx = findColIdx(["urgensi", "urgency", "prioritas"]);
          const compIdx = findColIdx(["target kompetensi", "kompetensi", "competencies"]);
          const successorIdIdx = findColIdx(["id suksesor", "suksesor id", "assignedsuccessorid"]);
          const suitabilityIdx = findColIdx(["status kesesuaian", "suitability", "status suksesi"]);

          importedPositions = dataRows.map((r, idx) => {
            const getR = (i: number) => (i >= 0 && i < r.length ? r[i].trim() : "");
            const posName = getR(nameIdx) || `Posisi Import ${idx + 1}`;
            const incumbent = getR(incumbentIdx) || "Petahana";
            const date = getR(dateIdx) || "2026-12-31";
            const div = getR(divIdx) || "General Affairs";
            const rawUrg = getR(urgencyIdx).toLowerCase();
            const urgencyVal: "High" | "Medium" | "Low" = rawUrg.includes("high") || rawUrg.includes("tinggi") ? "High" : rawUrg.includes("low") || rawUrg.includes("rendah") ? "Low" : "Medium";

            const rawComp = getR(compIdx);
            const competencies = rawComp ? rawComp.split(";").map(s => s.trim()).filter(Boolean) : ["Leadership", "Problem Solving"];
            const succId = getR(successorIdIdx) || undefined;
            const rawSuit = getR(suitabilityIdx).toLowerCase();
            const suitabilityVal: "Primary" | "Secondary" | "Emergency" = rawSuit.includes("second") ? "Secondary" : rawSuit.includes("emerg") ? "Emergency" : "Primary";

            return {
              id: getR(idIdx) || `pos-${Date.now()}-${idx}`,
              positionName: posName,
              currentIncumbent: incumbent,
              retirementDate: date,
              division: div,
              urgency: urgencyVal,
              targetCompetencies: competencies,
              assignedSuccessorId: succId,
              suitabilityStatus: suitabilityVal
            };
          });
        } else {
          throw new Error("Format berkas tidak didukung. Harap unggah berkas bertipe .json atau .csv.");
        }

        if (importedPositions.length === 0) {
          throw new Error("Tidak ada data posisi pensiun yang valid ditemukan.");
        }

        setRetiringPositions(importedPositions);
        addSecurityLog(`Berhasil mengimpor ${importedPositions.length} posisi Peta Suksesi & Manajemen Masa Pensiun.`, "success");
        alert(`Berhasil mengimpor ${importedPositions.length} posisi suksesi pensiun!\n\nData Peta Suksesi dan Manajemen Masa Pensiun telah diperbarui.`);
      } catch (err: any) {
        alert(`Gagal mengimpor data Peta Suksesi: ${err.message}`);
        addSecurityLog(`Gagal impor Peta Suksesi: ${err.message}`, "warning");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // User/Candidate interaction states
  const [aspirationText, setAspirationText] = useState("");
  const [preferredTraining, setPreferredTraining] = useState("Sertifikasi Analisis Data Lanjutan");
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Training & Development states
  const [isAddTrainingOpen, setIsAddTrainingOpen] = useState(false);
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [newTraining, setNewTraining] = useState({
    name: "",
    provider: "",
    date: "",
    type: "Leadership" as "Leadership" | "Technical" | "Management" | "Certification",
    status: "Planned" as "Planned" | "In Progress" | "Completed" | "Cancelled",
    notes: ""
  });

  // Add Talent States
  const [isAddTalentOpen, setIsAddTalentOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [newTalent, setNewTalent] = useState({
    name: "",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan",
    nik: "",
    title: "",
    division: "Technology Dept.",
    location: "Jakarta HQ",
    tenure: "3 Years",
    readiness: "READY 1-2 YEARS",
    avatar: MALE_AVATARS[0],
    grade: "M4",
    birthDate: "1988-10-10",
    age: 38,
    joinDate: "2021-01-01",
    logicalScore: 80,
    leadershipScore: 80,
    emotionalScore: 80,
    problemSolvingScore: 80,
    strategicScore: 80,
    stakeholderScore: 80,
    resultsScore: 80,
    idpTitle1: "Strategic Leadership Program",
    idpDesc1: "Advanced coaching on business strategy and scaling regional operations.",
    idpProgress1: 30,
    idpTitle2: "Data-Driven Decision Making",
    idpDesc2: "Focusing on big data analytics and practical predictive insights.",
    idpProgress2: 0,
    studyBackgroundName: "S1 Teknik Industri",
    studyBackgroundScore: 3,
  });

  const handleSyncAllPhotosByGender = () => {
    let count = 0;
    setTalents(prev => {
      return prev.map(t => {
        const detectedGender = t.gender || detectGenderFromName(t.name);
        const syncedAvatar = getSyncedAvatarUrl(t.name, detectedGender, t.avatar);
        if (t.gender !== detectedGender || t.avatar !== syncedAvatar) {
          count++;
        }
        return {
          ...t,
          gender: detectedGender,
          avatar: syncedAvatar
        };
      });
    });
    setAdminProfileSuccessMsg("Berhasil menyinkronkan foto profil seluruh talenta berdasarkan jenis kelamin (Perempuan & Laki-laki)!");
    setTimeout(() => setAdminProfileSuccessMsg(""), 5000);
  };

  const getCompetencyLabel = (value: number) => {
    if (value >= 90) return "Expert (5/5)";
    if (value >= 80) return "Advanced (4.5/5)";
    if (value >= 70) return "Advanced (4/5)";
    if (value >= 60) return "Proficient (3.5/5)";
    return "Developing (3/5)";
  };

  const handleUpdateReadiness = (talentId: string, newReadiness: string) => {
    const getReadinessColor = (ready: string): "emerald" | "amber" | "rose" | "teal" => {
      if (ready === "READY NOW") return "emerald";
      if (ready === "READY 1-2 YEARS") return "amber";
      if (ready === "READY 2+ YEARS") return "rose";
      return "teal";
    };

    setTalents(prev =>
      prev.map(t => {
        if (t.id === talentId) {
          return {
            ...t,
            readiness: newReadiness,
            readinessColor: getReadinessColor(newReadiness)
          };
        }
        return t;
      })
    );
  };

  const handleAddNewTalent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTalent.name || !newTalent.title) return;

    const id = newTalent.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    
    // Check if duplicate ID
    if (talents.some(t => t.id === id)) {
      alert("A candidate with a similar name already exists!");
      return;
    }

    const getReadinessColor = (ready: string): "emerald" | "amber" | "rose" | "teal" => {
      if (ready === "READY NOW") return "emerald";
      if (ready === "READY 1-2 YEARS") return "amber";
      if (ready === "READY 2+ YEARS") return "rose";
      return "teal";
    };

    const createdTalent: TalentProfile = {
      id,
      name: newTalent.name,
      nik: newTalent.nik,
      title: newTalent.title,
      division: newTalent.division,
      location: newTalent.location,
      tenure: newTalent.tenure,
      readiness: newTalent.readiness,
      readinessColor: getReadinessColor(newTalent.readiness),
      avatar: newTalent.avatar,
      grade: newTalent.grade || "M4",
      birthDate: newTalent.birthDate || "1988-10-10",
      age: Number(newTalent.age) || 38,
      joinDate: newTalent.joinDate || "2021-01-01",
      psychometric: {
        logicalReasoning: {
          name: "LOGICAL REASONING",
          score: Number(newTalent.logicalScore),
          description: "High conceptual analytics."
        },
        leadershipPotential: {
          name: "LEADERSHIP POTENTIAL",
          score: Number(newTalent.leadershipScore),
          description: "Inspires and directs teams."
        },
        emotionalAgility: {
          name: "EMOTIONAL AGILITY",
          score: Number(newTalent.emotionalScore),
          description: "Self-aware and adaptive."
        }
      },
      competencies: [
        {
          name: "Business Knowledge",
          score: Number(newTalent.problemSolvingScore),
          label: getCompetencyLabel(Number(newTalent.problemSolvingScore))
        },
        {
          name: "Leadership",
          score: Number(newTalent.strategicScore),
          label: getCompetencyLabel(Number(newTalent.strategicScore))
        },
        {
          name: "Problem Solving",
          score: Number(newTalent.stakeholderScore),
          label: getCompetencyLabel(Number(newTalent.stakeholderScore))
        },
        {
          name: "Interpersonal Skill",
          score: Number(newTalent.resultsScore),
          label: getCompetencyLabel(Number(newTalent.resultsScore))
        }
      ],
      idp: [
        {
          title: newTalent.idpTitle1 || "Strategic Leadership Program",
          status: Number(newTalent.idpProgress1) === 100 ? "Completed" : Number(newTalent.idpProgress1) > 0 ? "In Progress" : "Not Started",
          description: newTalent.idpDesc1 || "Advanced coaching on business strategy and scaling regional operations.",
          progress: Number(newTalent.idpProgress1)
        },
        {
          title: newTalent.idpTitle2 || "Data-Driven Decision Making",
          status: Number(newTalent.idpProgress2) === 100 ? "Completed" : Number(newTalent.idpProgress2) > 0 ? "In Progress" : "Not Started",
          description: newTalent.idpDesc2 || "Focusing on big data analytics and practical predictive insights.",
          progress: Number(newTalent.idpProgress2)
        }
      ],
      potentialAssessment: {
        kemampuanIntelektual: Math.min(Math.max(Math.round(Number(newTalent.logicalScore) / 33), 1), 3),
        berpikirKritis: 3,
        menyelesaikanMasalah: 2,
        belajarCepat: 3,
        kesadaranDiri: 2,
        interpersonal: 2,
        kecerdasanEmosional: 2,
        motivasiKomitmen: 3,
        businessKnowledge: Math.min(Math.max(Math.round(Number(newTalent.strategicScore) / 20), 1), 5),
        leadership: Math.min(Math.max(Math.round(Number(newTalent.leadershipScore) / 20), 1), 5),
        problemSolving: Math.min(Math.max(Math.round(Number(newTalent.problemSolvingScore) / 20), 1), 5),
        interpersonalSkill: Math.min(Math.max(Math.round(Number(newTalent.stakeholderScore) / 20), 1), 5),
        strategicMindset: Math.min(Math.max(Math.round(Number(newTalent.strategicScore) / 20), 1), 5),
        managesComplexity: 3,
        ensuresAccountability: Math.min(Math.max(Math.round(Number(newTalent.resultsScore) / 20), 1), 5),
        drivesVision: 3,
        cultivateInnovation: 2,
        studyBackgroundName: newTalent.studyBackgroundName,
        studyBackgroundScore: Number(newTalent.studyBackgroundScore),
        targetLevel: "DM"
      }
    };

    setTalents(prev => [...prev, createdTalent]);
    setExecutiveCommentary(prev => ({
      ...prev,
      [id]: `Newly calibrated candidate profile for ${createdTalent.name}. Showing remarkable core leadership indicators with positive succession outlook.`
    }));

    // Select the new talent immediately & open profile
    setSelectedTalentId(id);
    setActiveTab("profile");
    setIsAddTalentOpen(false);

    // Reset Form
    setNewTalent({
      name: "",
      nik: "",
      title: "",
      division: "Technology Dept.",
      location: "Jakarta HQ",
      tenure: "3 Years",
      readiness: "READY 1-2 YEARS",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      grade: "M4",
      birthDate: "1988-10-10",
      age: 38,
      joinDate: "2021-01-01",
      logicalScore: 80,
      leadershipScore: 80,
      emotionalScore: 80,
      problemSolvingScore: 80,
      strategicScore: 80,
      stakeholderScore: 80,
      resultsScore: 80,
      idpTitle1: "Strategic Leadership Program",
      idpDesc1: "Advanced coaching on business strategy and scaling regional operations.",
      idpProgress1: 30,
      idpTitle2: "Data-Driven Decision Making",
      idpDesc2: "Focusing on big data analytics and practical predictive insights.",
      idpProgress2: 0,
      studyBackgroundName: "S1 Teknik Industri",
      studyBackgroundScore: 3,
    });
  };

  const handleImportData = (rawText: string, fileType: "json" | "csv") => {
    try {
      const res = processTalentImportRows(rawText, fileType);
      alert(`Sukses Import & Sinkronisasi Data!\n- ${res.createdCount} Talenta baru ditambahkan\n- ${res.updatedCount} Talenta diperbarui`);
      setIsImportOpen(false);
    } catch (err: any) {
      alert("Gagal melakukan impor data: " + err.message);
    }
  };

  // Find currently active talent profile
  const currentTalent = talents.find((t) => t.id === selectedTalentId) || talents[0];

  // Unique divisions and readiness categories for filters
  const divisions = ["All", ...Array.from(new Set(talents.map((t) => t.division)))];
  const readinessOptions = ["All", ...Array.from(new Set(talents.map((t) => t.readiness)))];

  // Filtered talent pool list
  const filteredTalents = talents.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivision = divisionFilter === "All" || t.division === divisionFilter;
    const matchesReadiness = readinessFilter === "All" || t.readiness === readinessFilter;
    return matchesSearch && matchesDivision && matchesReadiness;
  });

  // Helper for smart compact pagination
  const getPaginationRange = (current: number, total: number) => {
    const delta = 1;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (typeof i === 'number' && i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (typeof i === 'number' && i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = typeof i === 'number' ? i : l;
    }

    return rangeWithDots;
  };

  // Paginated talent pool calculation
  const totalPages = Math.ceil(filteredTalents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTalents = filteredTalents.slice(startIndex, endIndex);

  // Calculate high level metrics
  const totalTalents = talents.length;
  const readyNowCount = talents.filter((t) => t.readiness === "READY NOW").length;
  const avgLogicalScore = Math.round(talents.reduce((sum, t) => sum + t.psychometric.logicalReasoning.score, 0) / totalTalents);
  const avgLeadershipScore = Math.round(talents.reduce((sum, t) => sum + t.psychometric.leadershipPotential.score, 0) / totalTalents);

  const getDeptAbbreviation = (dept: string): string => {
    if (!dept) return "";
    const trimmed = dept.trim();
    const knownMap: Record<string, string> = {
      "General Affairs": "GA",
      "General Affairs Dept.": "GA",
      "General Affairs Dept": "GA",
      "Human Capital Management": "HCM",
      "Human Capital Management Dept.": "HCM",
      "Human Capital Management Dept": "HCM",
      "Human Resources": "HR",
      "Human Resource": "HR",
      "Technology Dept.": "Tech",
      "Technology": "Tech",
      "Information Technology": "IT",
      "Supply Chain & Logistics": "SCM",
      "Supply Chain": "SCM",
      "Supply Chain Dept.": "SCM",
      "Finance & Control": "Finance",
      "Finance & Accounting": "FA",
      "Sales & Commercial": "Sales",
      "Marketing": "Mkt",
      "Health Safety & Environtment Dept (A-MJK)": "HSE",
      "Health Safety & Environment": "HSE",
      "Health Safety & Environment Dept": "HSE",
      "Food Ingredients-1 (A-MJK)": "FI-1",
      "Food Ingredients": "FI",
      "Factory Operational Excellence  (A-MJK) Dept": "FOE",
      "Factory Operational Excellence": "FOE",
      "Procurement & EXIM (A-MJK)": "Procurement",
      "Quality Assurance": "QA",
      "Quality Assurance Dept.": "QA",
      "Research & Development": "R&D",
      "Research & Development Dept.": "R&D",
    };

    if (knownMap[trimmed]) return knownMap[trimmed];

    const clean = trimmed.replace(/\s*\(.*?\)\s*/g, " ").replace(/Dept\.?/gi, "").trim();
    if (knownMap[clean]) return knownMap[clean];

    if (clean.length > 12) {
      const words = clean.split(/\s+/).filter(w => !["and", "&", "of", "the", "dept"].includes(w.toLowerCase()));
      if (words.length > 1) {
        return words.map(w => w[0].toUpperCase()).join("");
      }
      return clean.substring(0, 10) + "..";
    }
    return clean || trimmed;
  };

  const highPotentialDistributionData = React.useMemo(() => {
    // Group by division
    const groups: { [key: string]: { division: string; shortDivision: string; highPotentialCount: number; otherCount: number; totalCount: number } } = {};
    
    talents.forEach((t) => {
      const div = t.division || "Other Department";
      if (!groups[div]) {
        groups[div] = {
          division: div,
          shortDivision: getDeptAbbreviation(div),
          highPotentialCount: 0,
          otherCount: 0,
          totalCount: 0
        };
      }
      
      const placement = getTalentPlacement(t);
      const isHighPotential = placement.potential === "High";
      
      groups[div].totalCount += 1;
      if (isHighPotential) {
        groups[div].highPotentialCount += 1;
      } else {
        groups[div].otherCount += 1;
      }
    });
    
    return Object.values(groups).sort((a, b) => b.highPotentialCount - a.highPotentialCount || b.totalCount - a.totalCount);
  }, [talents]);

  const talentGapAnalysis = React.useMemo(() => {
    const gaps: string[] = [];
    const strong: string[] = [];
    
    highPotentialDistributionData.forEach(item => {
      if (item.highPotentialCount === 0 && item.totalCount > 0) {
        gaps.push(item.division);
      } else if (item.highPotentialCount > 0 && item.highPotentialCount / item.totalCount >= 0.5) {
        strong.push(item.division);
      }
    });
    
    return { gaps, strong };
  }, [highPotentialDistributionData]);

  const performanceTrendData = React.useMemo(() => {
    const years = evaluationYears.map(yr => ({ key: `fy${yr}`, label: `FY ${yr}` }));

    return years.map(({ key, label }) => {
      let totalScore = 0;
      let count = 0;
      
      talents.forEach((t) => {
        let score = t.performanceEvaluation?.[key];
        if (score === undefined || score === null) {
          score = 3;
        }
        totalScore += score;
        count++;
      });
      
      const avg = count > 0 ? totalScore / count : 3;
      const percentage = (avg / 5.0) * 100;
      
      return {
        year: label,
        averageRating: parseFloat(avg.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(1)),
      };
    });
  }, [talents, evaluationYears]);

  const trendAnalytics = React.useMemo(() => {
    if (performanceTrendData.length < 2) return { direction: "flat", diff: "0", percentageChange: "0", message: "" };
    const first = performanceTrendData[0].averageRating;
    const last = performanceTrendData[performanceTrendData.length - 1].averageRating;
    const diff = last - first;
    const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    const percentageChange = ((last - first) / first) * 100;
    
    let message = "";
    if (direction === "up") {
      message = `Tren positif terdeteksi! Rata-rata kinerja meningkat sebesar ${Math.abs(percentageChange).toFixed(1)}% dari ${first.toFixed(2)} ke ${last.toFixed(2)}. Ini mengindikasikan program peningkatan kompetensi organisasi berjalan efektif.`;
    } else if (direction === "down") {
      message = `Tren penurunan terdeteksi sebesar ${Math.abs(percentageChange).toFixed(1)}% dari ${first.toFixed(2)} ke ${last.toFixed(2)}. Evaluasi program retensi atau distribusi beban kerja mungkin diperlukan.`;
    } else {
      message = `Kinerja rata-rata organisasi stabil di angka ${last.toFixed(2)} / 5.00 selama 5 tahun terakhir.`;
    }

    return {
      direction,
      diff: Math.abs(diff).toFixed(2),
      percentageChange: Math.abs(percentageChange).toFixed(1),
      message
    };
  }, [performanceTrendData]);

  // Quick Insights: Auto-highlight top 3 highest-rated and top 3 lowest-rated talents based on current heatmap/matrix data
  const quickInsightsData = React.useMemo(() => {
    const ratedTalents = talents.map((t) => {
      const perfScore = getTalentPerformanceScore(t);
      const potDetails = calculateTalentPotentialDetails(t);
      const potScore = Math.round(potDetails.totalPotentialScore);
      const exactScore = (perfScore + potScore) / 2;
      const overallRating = Math.round(exactScore);
      const placement = getTalentPlacement(t);
      const cellName = getCellName(placement.performance, placement.potential);
      return {
        talent: t,
        perfScore,
        potScore,
        exactScore,
        overallRating,
        placement,
        cellName
      };
    });

    const topHighest = [...ratedTalents].sort((a, b) => {
      if (b.exactScore !== a.exactScore) return b.exactScore - a.exactScore;
      if (b.perfScore !== a.perfScore) return b.perfScore - a.perfScore;
      return b.potScore - a.potScore;
    }).slice(0, 3);

    const topLowest = [...ratedTalents].sort((a, b) => {
      if (a.exactScore !== b.exactScore) return a.exactScore - b.exactScore;
      if (a.perfScore !== b.perfScore) return a.perfScore - b.perfScore;
      return a.potScore - b.potScore;
    }).slice(0, 3);

    return { topHighest, topLowest };
  }, [talents, evaluationYears]);

  const skillGapHeatmapData = React.useMemo(() => {
    const competenciesList = [
      "Business Knowledge",
      "Leadership",
      "Problem Solving",
      "Interpersonal Skill",
      "Strategic Mindset",
      "Manages Complexity",
      "Ensures Accountability",
      "Drives Vision",
      "Cultivate Innovation"
    ];

    const compKeyMap: { [key: string]: keyof PotentialAssessment } = {
      "Business Knowledge": "businessKnowledge",
      "Leadership": "leadership",
      "Problem Solving": "problemSolving",
      "Interpersonal Skill": "interpersonalSkill",
      "Strategic Mindset": "strategicMindset",
      "Manages Complexity": "managesComplexity",
      "Ensures Accountability": "ensuresAccountability",
      "Drives Vision": "drivesVision",
      "Cultivate Innovation": "cultivateInnovation"
    };

    const divisions = Array.from(new Set(talents.map((t) => t.division || "Other Department")));
    
    const heatmap = divisions.map((div) => {
      const divTalents = talents.filter((t) => t.division === div);
      const competencyGaps = competenciesList.map((compName) => {
        let totalScore = 0;
        let count = 0;
        const belowTargetTalents: { name: string; score: number }[] = [];

        divTalents.forEach((t) => {
          let rating = 3.0;
          const paKey = compKeyMap[compName];
          if (t.potentialAssessment && t.potentialAssessment[paKey] !== undefined) {
            rating = Number(t.potentialAssessment[paKey]) || 3.0;
          } else {
            const comp = t.competencies?.find((c) => c.name.toLowerCase() === compName.toLowerCase());
            if (comp && comp.score !== undefined) {
              rating = comp.score / 20;
            }
          }

          totalScore += rating;
          count++;

          if (rating < managerialTarget) {
            belowTargetTalents.push({ name: t.name, score: rating });
          }
        });

        const avgRating = count > 0 ? totalScore / count : 3.0;
        const gap = avgRating - managerialTarget;

        return {
          competencyName: compName,
          avgRating: parseFloat(avgRating.toFixed(2)),
          gap: parseFloat(gap.toFixed(2)),
          belowTargetCount: belowTargetTalents.length,
          belowTargetTalents,
        };
      });

      return {
        division: div,
        talentsCount: divTalents.length,
        competencyGaps,
      };
    });

    return {
      heatmap,
      competenciesList,
      divisions,
    };
  }, [talents, managerialTarget]);

  // Filtered heatmap rows
  const filteredHeatmapRows = React.useMemo(() => {
    return skillGapHeatmapData.heatmap.filter((row) => {
      if (heatmapSearch.trim() !== "") {
        const q = heatmapSearch.toLowerCase();
        if (!row.division.toLowerCase().includes(q)) return false;
      }
      if (heatmapDeptFilter !== "All" && row.division !== heatmapDeptFilter) {
        return false;
      }
      if (heatmapGapFilter === "Critical") {
        return row.competencyGaps.some(g => g.gap < -0.5);
      } else if (heatmapGapFilter === "HasGap") {
        return row.competencyGaps.some(g => g.gap < 0);
      } else if (heatmapGapFilter === "NoGap") {
        return row.competencyGaps.every(g => g.gap >= 0);
      }
      return true;
    });
  }, [skillGapHeatmapData.heatmap, heatmapSearch, heatmapDeptFilter, heatmapGapFilter]);

  // Filtered active candidates
  const filteredActiveCandidates = React.useMemo(() => {
    return talents.filter((t) => {
      if (activeCandidateSearch.trim() !== "") {
        const q = activeCandidateSearch.toLowerCase();
        const match = t.name.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.division.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (activeCandidateDivisionFilter !== "All" && t.division !== activeCandidateDivisionFilter) {
        return false;
      }
      if (activeCandidateReadinessFilter !== "All" && t.readiness.toLowerCase() !== activeCandidateReadinessFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [talents, activeCandidateSearch, activeCandidateDivisionFilter, activeCandidateReadinessFilter]);

  const skillGapSummary = React.useMemo(() => {
    let largestNegativeGap = 0;
    let worstComp = "";
    let worstDiv = "";
    let totalGapsCount = 0;

    skillGapHeatmapData.heatmap.forEach((row) => {
      row.competencyGaps.forEach((g) => {
        if (g.gap < 0) {
          totalGapsCount++;
          if (g.gap < largestNegativeGap) {
            largestNegativeGap = g.gap;
            worstComp = g.competencyName;
            worstDiv = row.division;
          }
        }
      });
    });

    return {
      largestNegativeGap: Math.abs(largestNegativeGap),
      worstComp,
      worstDiv,
      totalGapsCount,
    };
  }, [skillGapHeatmapData]);

  const highUrgencyPositionsWithoutReadySuccessor = React.useMemo(() => {
    return retiringPositions.filter((pos) => {
      if (pos.urgency !== "High") return false;
      
      if (!pos.assignedSuccessorId) {
        return true; // No successor assigned
      }
      
      const successor = talents.find((t) => t.id === pos.assignedSuccessorId);
      if (!successor) {
        return true; // Assigned successor not found in talents list
      }
      
      return successor.readiness.toUpperCase() !== "READY NOW";
    });
  }, [retiringPositions, talents]);

  // Update a single score in state for interactive simulation
  const handleScoreChange = (metricType: "psychometric" | "competency", name: string, value: number) => {
    setTalents((prevTalents) =>
      prevTalents.map((t) => {
        if (t.id === selectedTalentId) {
          if (metricType === "psychometric") {
            const key = name as keyof typeof t.psychometric;
            return {
              ...t,
              psychometric: {
                ...t.psychometric,
                [key]: {
                  ...t.psychometric[key],
                  score: value
                }
              }
            };
          } else {
            return {
              ...t,
              competencies: t.competencies.map((comp) => {
                if (comp.name === name) {
                  let label = comp.label;
                  if (value >= 90) label = "Expert (5/5)";
                  else if (value >= 80) label = "Advanced (4.5/5)";
                  else if (value >= 70) label = "Advanced (4/5)";
                  else if (value >= 60) label = "Proficient (3.5/5)";
                  else label = "Developing (3/5)";
                  
                  return {
                    ...comp,
                    score: value,
                    label
                  };
                }
                return comp;
              })
            };
          }
        }
        return t;
      })
    );
  };

  const handlePotentialMetricChange = (field: keyof PotentialAssessment, value: number | string) => {
    setTalents((prevTalents) =>
      prevTalents.map((t) => {
        if (t.id === selectedTalentId) {
          const assessment = ensurePotentialAssessment(t);
          return {
            ...t,
            potentialAssessment: {
              ...assessment,
              [field]: value
            }
          };
        }
        return t;
      })
    );
  };

  const handlePerformanceEvaluationChange = (year: string, value: number) => {
    setTalents((prevTalents) =>
      prevTalents.map((t) => {
        if (t.id === selectedTalentId) {
          const prevEval = t.performanceEvaluation || evaluationYears.reduce((acc, yr) => {
            acc[`fy${yr}`] = 3;
            return acc;
          }, {} as Record<string, number>);
          return {
            ...t,
            performanceEvaluation: {
              ...prevEval,
              [year]: value
            }
          };
        }
        return t;
      })
    );
  };

  const handlePerformanceEvaluationChangeDirect = (talentId: string, year: string, value: number) => {
    setTalents((prevTalents) =>
      prevTalents.map((t) => {
        if (t.id === talentId) {
          const prevEval = t.performanceEvaluation || evaluationYears.reduce((acc, yr) => {
            acc[`fy${yr}`] = 3;
            return acc;
          }, {} as Record<string, number>);
          return {
            ...t,
            performanceEvaluation: {
              ...prevEval,
              [year]: value
            }
          };
        }
        return t;
      })
    );
  };

  const handleAddTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraining.name || !newTraining.provider || !newTraining.date) return;

    setTalents(prev => prev.map(t => {
      if (t.id === selectedTalentId) {
        const currentTrainings = t.trainings || [];
        return {
          ...t,
          trainings: [
            ...currentTrainings,
            {
              id: "tr-" + Date.now(),
              name: newTraining.name,
              provider: newTraining.provider,
              date: newTraining.date,
              type: newTraining.type,
              status: newTraining.status,
              notes: newTraining.notes
            }
          ]
        };
      }
      return t;
    }));

    setIsAddTrainingOpen(false);
    setNewTraining({
      name: "",
      provider: "",
      date: "",
      type: "Technical",
      status: "Planned",
      notes: ""
    });
  };

  const handleStartEditTraining = (training: any) => {
    setEditingTrainingId(training.id);
    setNewTraining({
      name: training.name,
      provider: training.provider,
      date: training.date,
      type: training.type,
      status: training.status,
      notes: training.notes || ""
    });
    setIsAddTrainingOpen(true);
  };

  const handleSaveEditTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraining.name || !newTraining.provider || !newTraining.date || !editingTrainingId) return;

    setTalents(prev => prev.map(t => {
      if (t.id === selectedTalentId) {
        const currentTrainings = t.trainings || [];
        return {
          ...t,
          trainings: currentTrainings.map(tr => {
            if (tr.id === editingTrainingId) {
              return {
                ...tr,
                name: newTraining.name,
                provider: newTraining.provider,
                date: newTraining.date,
                type: newTraining.type,
                status: newTraining.status,
                notes: newTraining.notes
              };
            }
            return tr;
          })
        };
      }
      return t;
    }));

    setIsAddTrainingOpen(false);
    setEditingTrainingId(null);
    setNewTraining({
      name: "",
      provider: "",
      date: "",
      type: "Technical",
      status: "Planned",
      notes: ""
    });
  };

  const handleDeleteTraining = (trainingId: string) => {
    const dynamicTalent = talents.find(t => t.id === selectedTalentId);
    const targetTraining = dynamicTalent?.trainings?.find(tr => tr.id === trainingId);
    triggerDeleteModal({
      title: "Hapus Program Pelatihan?",
      itemName: targetTraining?.name || "Program Pelatihan",
      itemSubtitle: `Penyelenggara: ${targetTraining?.provider || '-'} • Kategori: ${targetTraining?.type || 'Training'}`,
      warningText: "Apakah Anda yakin ingin menghapus program pelatihan ini dari rencana pengembangan IDP talenta?",
      confirmButtonText: "Ya, Hapus Pelatihan",
      onConfirm: () => {
        setTalents(prev => prev.map(t => {
          if (t.id === selectedTalentId) {
            const currentTrainings = t.trainings || [];
            return {
              ...t,
              trainings: currentTrainings.filter(tr => tr.id !== trainingId)
            };
          }
          return t;
        }));
        setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Rendering conditional authentication layers (Landing, Login)
  if (authState === "landing") {
    const currentPreviewTalent = talents.find(t => t.id === previewTalentId) || talents[0];
    const previewDetails = calculateTalentPotentialDetails(currentPreviewTalent);
    const pAss = previewDetails.assessment;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-primary/10">
        {/* Subtle grid accent background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none"></div>

        {/* Premium Navigation Header */}
        <header className="w-full bg-white/90 dark:bg-slate-900 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-lg bg-white/90 dark:bg-white inline-flex items-center justify-center shadow-2xs">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png" 
                  className="h-7 md:h-9 object-contain" 
                  alt="Ajinomoto Indonesia Group Logo" 
                />
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3 hidden sm:block">
                <span className="font-display text-sm font-black text-primary dark:text-teal-400 tracking-wide block leading-none">AJINOMOTO INDONESIA</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-300 font-extrabold uppercase tracking-wider block mt-1">Succession Suite</span>
              </div>
            </div>

            {/* Middle Nav Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-700 dark:text-slate-100">
              <a href="#metodologi" className="text-slate-700 dark:text-slate-100 hover:text-primary dark:hover:text-teal-400 transition-colors">Metodologi Asesmen</a>
              <a href="#fitur" className="text-slate-700 dark:text-slate-100 hover:text-primary dark:hover:text-teal-400 transition-colors">Pilar Evaluasi</a>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-700 dark:text-slate-100 font-extrabold">Akses HR Internal</span>
            </nav>
            
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              <button 
                onClick={() => setAuthState("login")}
                className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm shadow-primary/10 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <User className="w-4 h-4" />
                Masuk ke Portal
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 md:py-20 flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left Column: Copy & CTAs */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold text-slate-800 dark:text-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>WORKSPACE RESMI HUMAN RESOURCE</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Mempersiapkan Pemimpin Strategis <span className="text-primary dark:text-teal-400 relative inline-block">Ajinomoto Indonesia <span className="absolute left-0 bottom-0.5 w-full h-1 bg-primary/20 dark:bg-teal-400/30 rounded"></span></span>
              </h1>

              <p className="text-sm md:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                Standardisasi pemetaan suksesi kepemimpinan untuk <span className="font-bold text-slate-900 dark:text-white">seluruh pemangku jabatan</span>. Menghubungkan potensi kognitif psikotes, penilaian kompetensi manajerial, dan Individual Development Plan (IDP) dalam satu platform terpusat.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={() => setAuthState("login")}
                  className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-6 py-3.5 rounded-lg shadow-md shadow-primary/15 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Entry Sistem</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <a 
                  href="#metodologi"
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold px-6 py-3.5 rounded-lg shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Pelajari Parameter Matrix</span>
                </a>
              </div>

              {/* Demo Credentials Helper Box */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 max-w-lg space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Akses Cepat Pengujian Portal (Demo Account)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[9px] text-primary dark:text-teal-400 block font-black uppercase tracking-wider">AKSES FULL ADMIN</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-bold block mt-0.5">admin@ajinomoto.com</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 block text-[10px] mt-0.5">Sandi: password123</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[9px] text-primary dark:text-teal-400 block font-black uppercase tracking-wider">AKSES VIEW ONLY (EDWIN)</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-bold block mt-0.5">user@ajinomoto.com</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 block text-[10px] mt-0.5">Sandi: password123</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Mockup */}
            <div className="lg:col-span-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-left"
              >
                {/* Simulated MacOS Window Chrome */}
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400 block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 block" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-300 uppercase tracking-widest font-black">Succession Teaser Preview</span>
                  <div className="w-12" />
                </div>

                {/* Dashboard teaser container */}
                <div className="p-5 space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">Peta Suksesi (9-Box Teaser)</h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">Klik kandidat di sebelah kanan untuk menganalisis data suksesi</p>
                    </div>
                    <span className="bg-primary/10 dark:bg-teal-950 text-primary dark:text-teal-300 text-[9px] font-extrabold px-2 py-0.5 rounded border border-primary/20 dark:border-teal-700">ASV COMPLIANT</span>
                  </div>

                  {/* Split Dashboard layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    {/* Left: Interactive 9 Box Mini Map */}
                    <div className="sm:col-span-7 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col space-y-2">
                      <div className="flex justify-between text-[8px] font-extrabold text-slate-700 dark:text-slate-200 uppercase px-1">
                        <span>Y-Axis: Kinerja</span>
                        <span>X-Axis: Potensi</span>
                      </div>
                      
                      {/* 3x3 Mini Grid - Dynamically synced with talents state with fixed row heights & scrollable avatars */}
                      <div className="grid grid-cols-3 gap-1.5 w-full">
                        {[
                          { box: 4, label: "Enigma", pot: "Low", perf: "High", bg: "bg-amber-50 dark:bg-amber-950/40" },
                          { box: 7, label: "High Potential", pot: "Medium", perf: "High", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
                          { box: 9, label: "Star Candidate", pot: "High", perf: "High", bg: "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700" },
                          { box: 2, label: "Inconsistent", pot: "Low", perf: "Medium", bg: "bg-rose-50 dark:bg-rose-950/40" },
                          { box: 5, label: "Key Player", pot: "Medium", perf: "Medium", bg: "bg-amber-50 dark:bg-amber-950/40" },
                          { box: 8, label: "High Performer", pot: "High", perf: "Medium", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
                          { box: 1, label: "Underperformer", pot: "Low", perf: "Low", bg: "bg-rose-100 dark:bg-rose-900/50 border-rose-300 dark:border-rose-700" },
                          { box: 3, label: "Solid Performer", pot: "Medium", perf: "Low", bg: "bg-rose-50 dark:bg-rose-950/40" },
                          { box: 6, label: "Specialist", pot: "High", perf: "Low", bg: "bg-amber-50 dark:bg-amber-950/40" }
                        ].map((cell, idx) => {
                          const cellTalents = talents.filter(t => {
                            const placement = getTalentPlacement(t);
                            return placement.performance === cell.perf && placement.potential === cell.pot;
                          });

                          return (
                            <div 
                              key={idx} 
                              className={`rounded-lg p-1.5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between relative h-[110px] sm:h-[115px] overflow-hidden ${cell.bg}`}
                            >
                              <div className="flex justify-between items-center w-full z-10 shrink-0">
                                <span className="text-[7px] font-black text-slate-800 dark:text-slate-100 bg-white/90 dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                  Box {cell.box}
                                </span>
                                <span className="text-[7px] font-mono font-black text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 px-1 rounded">
                                  {cellTalents.length}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1 justify-start items-start h-full pt-1.5 overflow-y-auto max-h-[82px] custom-scrollbar pr-0.5 w-full">
                                {cellTalents.length === 0 ? (
                                  <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-500 dark:text-slate-400 font-semibold italic">
                                    - Kosong -
                                  </div>
                                ) : (
                                  cellTalents.map(tObj => {
                                    const isSelected = previewTalentId === tObj.id;
                                    const initials = tObj.name ? tObj.name.split(" ").map(n => n[0]).slice(0, 3).join("") : "?";
                                    return (
                                      <button
                                        key={tObj.id}
                                        onClick={() => setPreviewTalentId(tObj.id)}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black transition-all cursor-pointer shrink-0 ${
                                          isSelected 
                                            ? "bg-primary text-white scale-110 ring-2 ring-primary ring-offset-1 ring-offset-white dark:ring-offset-slate-900 shadow-sm z-10 animate-pulse" 
                                            : "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 hover:scale-105 opacity-90 hover:opacity-100"
                                        }`}
                                        title={`${tObj.name} (${tObj.title || tObj.division})`}
                                      >
                                        {initials}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Candidate Details */}
                    <div className="sm:col-span-5 flex flex-col justify-between space-y-3 bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">Kandidat Asesmen</span>
                          <span className="text-[9px] text-slate-600 dark:text-slate-300 font-mono font-bold">({talents.filter(t => !teaserSearch || t.name.toLowerCase().includes(teaserSearch.toLowerCase()) || t.division.toLowerCase().includes(teaserSearch.toLowerCase())).length})</span>
                        </div>
                        
                        <div className="relative">
                          <Search className="w-2.5 h-2.5 absolute left-2 top-2 text-slate-400 dark:text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari nama kandidat..."
                            value={teaserSearch}
                            onChange={(e) => setTeaserSearch(e.target.value)}
                            className="w-full pl-6 pr-2 py-1 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
                          {talents
                            .filter(t => !teaserSearch || t.name.toLowerCase().includes(teaserSearch.toLowerCase()) || t.division.toLowerCase().includes(teaserSearch.toLowerCase()) || t.title.toLowerCase().includes(teaserSearch.toLowerCase()))
                            .map((t) => {
                              const isSelected = t.id === previewTalentId;
                              const placement = getTalentPlacement(t);
                              const boxNum = placement.performance === "High" ? (placement.potential === "Low" ? 4 : placement.potential === "Medium" ? 7 : 9)
                                : placement.performance === "Medium" ? (placement.potential === "Low" ? 2 : placement.potential === "Medium" ? 5 : 8)
                                : (placement.potential === "Low" ? 1 : placement.potential === "Medium" ? 3 : 6);
                              
                              const boxBg = boxNum === 9 ? "bg-emerald-500 text-white" 
                                : boxNum === 8 || boxNum === 7 ? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : boxNum === 6 || boxNum === 5 || boxNum === 4 ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                : "bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30";

                              return (
                                <button
                                  key={t.id}
                                  onClick={() => setPreviewTalentId(t.id)}
                                  className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-bold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                                    isSelected 
                                      ? "bg-primary text-white shadow-sm ring-1 ring-primary" 
                                      : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-black">{t.name}</div>
                                    <div className={`text-[8px] truncate ${isSelected ? "text-white/90" : "text-slate-600 dark:text-slate-300 font-semibold"}`}>
                                      {t.title || t.division} ({t.division})
                                    </div>
                                  </div>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 ${isSelected ? "bg-white/20 text-white" : boxBg}`}>
                                    Box {boxNum}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[7px] font-black text-white shrink-0">
                              {currentPreviewTalent.name[0]}
                            </span>
                            <div className="min-w-0">
                              <span className="font-black text-[10px] text-slate-900 dark:text-slate-100 block truncate">{currentPreviewTalent.name}</span>
                              <span className="text-[8px] text-slate-600 dark:text-slate-300 font-semibold block truncate">{currentPreviewTalent.title} ({currentPreviewTalent.division})</span>
                            </div>
                          </div>
                          {(() => {
                            const placement = getTalentPlacement(currentPreviewTalent);
                            const boxNum = placement.performance === "High" ? (placement.potential === "Low" ? 4 : placement.potential === "Medium" ? 7 : 9)
                              : placement.performance === "Medium" ? (placement.potential === "Low" ? 2 : placement.potential === "Medium" ? 5 : 8)
                              : (placement.potential === "Low" ? 1 : placement.potential === "Medium" ? 3 : 6);
                            return (
                              <span className="px-2 py-0.5 rounded text-[8px] font-black bg-primary/10 dark:bg-teal-950 text-primary dark:text-teal-300 border border-primary/20 shrink-0">
                                Box {boxNum}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="space-y-1.5">
                          <div>
                            <div className="flex justify-between text-[8px] font-extrabold text-slate-700 dark:text-slate-200">
                              <span>Skor Kinerja (Y)</span>
                              <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{getTalentPerformanceScore(currentPreviewTalent).toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-0.5">
                              <div className="bg-emerald-500 h-1" style={{ width: `${(getTalentPerformanceScore(currentPreviewTalent) / 50) * 100}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[8px] font-extrabold text-slate-700 dark:text-slate-200">
                              <span>Skor Potensi (X)</span>
                              <span className="font-mono text-primary dark:text-teal-400 font-black">{previewDetails.totalPotentialScore.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-0.5">
                              <div className="bg-primary dark:bg-teal-400 h-1" style={{ width: `${previewDetails.totalPotentialScore}%` }} />
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded text-[8px] text-slate-700 dark:text-slate-200 font-bold flex justify-between items-center leading-normal">
                            <span>Status Suksesi:</span>
                            <span className={`font-black px-1 py-0.2 rounded uppercase text-[7px] ${
                              previewDetails.totalPotentialScore >= 80 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" 
                                : previewDetails.totalPotentialScore >= 60
                                ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                            }`}>
                              {previewDetails.totalPotentialScore >= 80 ? "Siap Suksesi" : previewDetails.totalPotentialScore >= 60 ? "Pengembangan" : "Perlu Asesmen"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* Metodologi Section */}
        <section id="metodologi" className="py-16 md:py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-black text-primary dark:text-teal-400 uppercase tracking-wider block">Standardisasi Metodologi Penilaian</span>
              <h2 className="font-display text-2xl md:text-3.5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Perhitungan Bobot Parameter Suksesi</h2>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
                Platform suksesi ini mengadopsi integrasi tiga variabel penilaian dengan persentase bobot tetap untuk menjaga transparansi, keadilan, dan akurasi suksesi kepemimpinan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/40 dark:hover:border-teal-500/40 transition-all text-left space-y-4 shadow-xs">
                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/80 rounded-lg flex items-center justify-center text-primary dark:text-teal-400 border border-teal-100 dark:border-teal-800/60">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-primary dark:text-teal-400 block uppercase tracking-wider">Bobot Nilai: 40%</span>
                  <h3 className="font-display font-black text-base text-slate-900 dark:text-slate-100">1. Psikotes & Potensi Kognitif</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Menganalisis 8 aspek kognitif fundamental termasuk kemampuan berpikir kritis, pemecahan masalah kompleks, kecerdasan interpersonal, serta tingkat komitmen & motivasi kerja.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400/40 dark:hover:border-indigo-500/40 transition-all text-left space-y-4 shadow-xs">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/80 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">Bobot Nilai: 50%</span>
                  <h3 className="font-display font-black text-base text-slate-900 dark:text-slate-100">2. Matriks Kompetensi Jabatan</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Validasi lapangan terhadap 9 dimensi kemampuan strategis: Business Knowledge, Leadership, Problem Solving, Strategic Mindset, hingga Ensures Accountability.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400/40 dark:hover:border-emerald-500/40 transition-all text-left space-y-4 shadow-xs">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/80 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">Bobot Nilai: 10%</span>
                  <h3 className="font-display font-black text-base text-slate-900 dark:text-slate-100">3. Linieritas Latar Akademis</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Mengukur kecocokan tingkat latar belakang akademis (S1/S2/S3) serta relevansi spesialisasi pendidikan formal terhadap target posisi suksesi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Internal Security & Policy Section */}
        <section id="fitur" className="py-14 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 text-left">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <span className="text-[10px] font-black text-primary dark:text-teal-400 uppercase tracking-wider block">Ajinomoto Indonesia Shared Value (ASV) & Governance</span>
                <h3 className="font-display text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Keamanan Data & Integritas Penilaian Suksesi</h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Sistem ini dioperasikan sepenuhnya di bawah pengawasan department Human Resource Ajinomoto Indonesia. Seluruh proses pengolahan data talenta dilindungi enkripsi tingkat tinggi untuk memastikan objektivitas tanpa intervensi subjek.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Enkripsi Kredensial SSL</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Audit Asesmen Berkala</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 dark:bg-teal-950/80 rounded-lg text-primary dark:text-teal-400 mt-0.5">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">Penyelarasan Kompetensi Ajinomoto Indonesia</h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-normal mt-0.5">Memastikan suksesi eksekutif mencerminkan visi kontribusi sosial pangan dan kesehatan global berkelanjutan.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 rounded-lg text-indigo-600 dark:text-indigo-400 mt-0.5">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">Standardisasi Asesmen Independen</h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-normal mt-0.5">Menghilangkan bias evaluasi internal melalui integrasi langsung dari hasil tes psikotes pihak ketiga berlisensi.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Clean Footer */}
        <footer className="bg-white dark:bg-slate-900 py-8 border-t border-slate-200 dark:border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded bg-white/90 dark:bg-white inline-flex items-center justify-center shadow-2xs">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png" 
                  className="h-5 object-contain" 
                  alt="Ajinomoto Indonesia Logo" 
                />
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-200">© {new Date().getFullYear()} PT Ajinomoto Indonesia. Succession Strategy Board.</span>
            </div>
            <div className="flex gap-4 font-bold text-slate-700 dark:text-slate-200">
              <a href="#" className="hover:text-primary dark:hover:text-teal-400 transition-colors">Panduan Sistem</a>
              <a href="#" className="hover:text-primary dark:hover:text-teal-400 transition-colors">Kerahasiaan Data</a>
              <a href="#" className="hover:text-primary dark:hover:text-teal-400 transition-colors">HR Support</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (authState === "login") {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoggingIn(true);
      setLoginError("");

      setTimeout(() => {
        if (loginEmail === "admin@ajinomoto.com" && loginPassword === "password123") {
          setAuthState("authenticated");
          setUserRole("admin");
          setActiveTab("home");
        } else if (loginEmail === "user@ajinomoto.com" && loginPassword === "password123") {
          setAuthState("authenticated");
          setUserRole("user");
          setSelectedTalentId("edwin-prasetyo");
          setActiveTab("profile");
        } else {
          setLoginError("Email atau sandi yang Anda masukkan tidak valid.");
        }
        setIsLoggingIn(false);
      }, 1000);
    };

    const fillCredentials = (role: "admin" | "user") => {
      setLoginEmail(role === "admin" ? "admin@ajinomoto.com" : "user@ajinomoto.com");
      setLoginPassword("password123");
    };

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:grid lg:grid-cols-12 font-sans selection:bg-primary/10">
        {/* Left Side: Branding */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-primary/40 text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png" 
                className="h-9 object-contain brightness-0 invert" 
                alt="Ajinomoto Indonesia Logo White" 
              />
              <div className="border-l border-white/20 pl-3">
                <span className="font-display text-sm font-black tracking-wider block leading-none">AJINOMOTO INDONESIA</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Succession Suite</span>
              </div>
            </div>

            <div className="pt-12 space-y-4">
              <span className="text-[10px] font-black text-primary dark:text-teal-400 uppercase tracking-widest bg-primary/10 dark:bg-teal-950/50 px-2.5 py-1 rounded border border-primary/25 dark:border-teal-800 inline-block">PORTAL INTERNAL HR</span>
              <h2 className="font-display text-3xl font-black tracking-tight leading-tight">
                Mencetak Pemimpin Masa Depan Berbasis Kompetensi Objektif
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed font-normal">
                Sistem suksesi kepemimpinan dirancang untuk memetakan kekuatan talenta internal, menyelaraskan target pengembangan diri (IDP), serta mengamankan kontinuitas kepemimpinan di seluruh lini jabatan PT Ajinomoto Indonesia secara akurat dan transparan.
              </p>
            </div>
          </div>

          <div className="relative z-10 bg-white/5 border border-white/10 p-5 rounded-xl backdrop-blur-md space-y-3.5">
            <div className="flex items-center gap-2 text-primary dark:text-teal-400">
              <Sparkles className="w-4.5 h-4.5" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">ASV CORE PHILOSOPHY</span>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed">
              "Kekuatan utama bisnis kami terletak pada pengembangan sumber daya manusia secara holistik, menyatukan nilai-nilai kontribusi sosial pangan dengan ketajaman kepemimpinan bisnis."
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-white">HR</div>
              <div>
                <span className="text-[10px] font-bold block leading-none text-white">Department Human Resource</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">PT Ajinomoto Indonesia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="flex-1 lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-white dark:bg-slate-900">
          <div className="flex justify-between items-center pb-8 lg:pb-0">
            <button 
              onClick={() => setAuthState("landing")}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-bold text-xs transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Beranda
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest hidden sm:inline">SSB SECURE LOGIN v2.1</span>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto my-auto py-8 space-y-8">
            <div className="space-y-2.5">
              <div className="lg:hidden flex items-center gap-3 mb-6">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png" 
                  className="h-8 object-contain dark:brightness-110" 
                  alt="Ajinomoto Indonesia Logo" 
                />
                <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                  <span className="font-display text-sm font-black text-primary dark:text-teal-400 tracking-wide block leading-none">AJINOMOTO INDONESIA</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mt-1">Succession Suite</span>
                </div>
              </div>

              <h1 className="font-display text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                Masuk ke Portal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gunakan kredensial resmi department Human Resource untuk mengelola asesmen suksesi pimpinan.
              </p>
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 text-rose-700 dark:text-rose-200 text-xs rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Autentikasi Gagal</span>
                  <p className="font-medium opacity-90">{loginError}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 block uppercase tracking-wider">Email Resmi</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary dark:focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium transition-all"
                    placeholder="nama@ajinomoto.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 block uppercase tracking-wider">Kata Sandi</label>
                  <a href="#" className="text-[10px] text-slate-400 dark:text-slate-400 hover:text-primary dark:hover:text-teal-400 font-bold">Lupa Sandi?</a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary dark:focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-lg transition-all active:scale-[0.98] shadow-md shadow-primary/10 text-xs flex justify-center items-center gap-2 mt-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi Kredensial...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>MASUK PORTAL AMAN</span>
                  </>
                )}
              </button>
            </form>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">AKSES CEPAT PORTAL</span>
                </div>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded">DEMO</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => fillCredentials("admin")}
                  className="text-left p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-all group hover:border-slate-300 cursor-pointer"
                >
                  <span className="text-[9px] text-primary dark:text-teal-400 font-black block uppercase tracking-wide">AKSES ADMINISTRATOR</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-200 font-bold block truncate mt-0.5">admin@ajinomoto.com</span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-400 block font-medium mt-1 group-hover:text-primary dark:group-hover:text-teal-400 transition-colors">Klik untuk isi otomatis →</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials("user")}
                  className="text-left p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-all group hover:border-slate-300 cursor-pointer"
                >
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black block uppercase tracking-wide">AKSES VIEW ONLY (EDWIN)</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-200 font-bold block truncate mt-0.5">user@ajinomoto.com</span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-400 block font-medium mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Klik untuk isi otomatis →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secure footer */}
          <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            <span>SISTEM DIENKRIPSI SSL 256-BIT</span>
            <span>DEPARTMENT HR PT AJINOMOTO INDONESIA</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans">
      {/* Top App Bar (Mobile UI) */}
      <header className="md:hidden w-full top-0 sticky bg-surface-container-lowest border-b border-surface-container-highest flex justify-between items-center px-5 py-3 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (activeTab !== "profile") {
                setActiveTab("profile");
              }
            }}
            className="text-primary active:scale-95 duration-150 p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png" 
              className="h-6 object-contain" 
              alt="Ajinomoto Indonesia Logo" 
            />
            <span className="font-display text-base font-extrabold text-primary">Advisor</span>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className="text-primary active:scale-95 duration-150 p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {/* Dropdown menu */}
          <AnimatePresence>
            {moreMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-surface-container-highest py-1 z-50 text-sm"
                >
                  <button 
                    onClick={() => {
                      setMoreMenuOpen(false);
                      setIsOverallSummaryModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-surface-container-low flex items-center gap-2 text-on-surface cursor-pointer font-bold text-emerald-800"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Report Summary System (All Data)
                  </button>
                  <button 
                    onClick={() => {
                      setMoreMenuOpen(false);
                      setIsReportModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-surface-container-low flex items-center gap-2 text-on-surface"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    Download PDF Profile Report
                  </button>
                  <button 
                    onClick={() => {
                      setMoreMenuOpen(false);
                      setIsEditingScores(!isEditingScores);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-surface-container-low flex items-center gap-2 text-on-surface"
                  >
                    <Sliders className="w-4 h-4 text-secondary" />
                    {isEditingScores ? "Lock Performance Ratings" : "Adjust Performance Ratings"}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 min-h-[calc(100vh-60px)] md:min-h-screen relative">
        
        {/* Navigation Drawer (Desktop Sidebar with Collapse/Expand support) */}
        <aside className={`hidden md:flex flex-col ${isSidebarCollapsed ? "w-[76px] p-2.5" : "w-[280px] p-4"} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none space-y-2 z-40 flex-shrink-0 sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out`}>
          
          {/* Brand Logo & Collapse Toggle Header */}
          <div className={`flex ${isSidebarCollapsed ? "flex-col gap-3 p-1" : "items-center justify-between pb-3.5 px-1"} mb-2 border-b border-slate-200 dark:border-slate-800`}>
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 transition-all">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png" className="h-8 object-contain drop-shadow-xs" alt="Ajinomoto Logo" />
                <div>
                  <span className="font-display text-[13px] font-black text-[#d6001c] dark:text-rose-400 tracking-wider block leading-tight">AJINOMOTO</span>
                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Succession Board</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center my-1 p-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700" title="Ajinomoto Indonesia Group">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ajinomoto_Group_Global_Brand_logo.png" className="h-7 object-contain" alt="Ajinomoto Logo" />
              </div>
            )}

            <button
              onClick={() => {
                setIsSidebarCollapsed(!isSidebarCollapsed);
                setShortcutToast(!isSidebarCollapsed ? "Sidebar Diperkecil (Collapsed)" : "Sidebar Diperlebar (Expanded)");
                setTimeout(() => setShortcutToast(null), 2500);
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
              title={isSidebarCollapsed ? "Perlebar Sidebar (Ctrl + B)" : "Perkecil Sidebar (Ctrl + B)"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Executive User profile card */}
          <div 
            onClick={() => {
              if (userRole === "admin") {
                setIsAdminMasterModalOpen(true);
              }
            }}
            className={`flex items-center ${isSidebarCollapsed ? "justify-center p-1.5" : "gap-3 p-2.5 px-3"} mb-2 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-xs hover:border-teal-400/80 dark:hover:border-teal-500/50 transition-all ${
              userRole === "admin" ? "cursor-pointer group" : ""
            }`}
            title={isSidebarCollapsed ? `Administrator: ${userRole === "admin" ? adminProfile.name : "Edwin Prasetyo"} (Klik Edit)` : (userRole === "admin" ? "Klik untuk Edit & Simpan Profiling Admin Master" : "")}
          >
            <div className={`relative ${isSidebarCollapsed ? "w-10 h-10" : "w-10 h-10"} rounded-xl ${userRole === "admin" ? "bg-teal-700 dark:bg-teal-600 text-white dark:text-slate-950 ring-2 ring-teal-500/30 shadow-xs" : "bg-emerald-600 text-white ring-2 ring-emerald-500/30"} flex items-center justify-center font-display font-black text-sm shrink-0`}>
              {userRole === "admin" ? adminProfile.initials : "EP"}
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500 shadow-2xs"></span>
            </div>

            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden text-left">
                <div className="flex items-center justify-between gap-1">
                  <h2 className="font-display text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate">
                    {userRole === "admin" ? adminProfile.name : "Edwin Prasetyo"}
                  </h2>
                  {userRole === "admin" && (
                    <UserCog className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 group-hover:rotate-45 transition-all shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                  {userRole === "admin" ? adminProfile.title : "Senior Candidate (User)"}
                </p>
              </div>
            )}
          </div>

          {/* Role Badge */}
          {!isSidebarCollapsed && (
            <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase text-center mb-2 shadow-2xs ${
              userRole === "admin" 
                ? "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60" 
                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>ROLE: {userRole === "admin" ? "ADMINISTRATOR" : "USER / KARYAWAN"}</span>
            </div>
          )}

          {/* Navigation Section Header */}
          {!isSidebarCollapsed && (
            <div className="px-2 pt-1 pb-1 flex items-center justify-between text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>Menu Navigasi</span>
              <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800"></span>
            </div>
          )}

          {/* Main Navigation Items */}
          <div className="space-y-1.5 flex-1">
            {userRole === "admin" && (
              <button 
                onClick={() => setActiveTab("home")}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl transition-all text-left group ${
                  activeTab === "home" 
                    ? "bg-primary dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-md shadow-primary/25 translate-x-0.5" 
                    : "text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-teal-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 font-bold hover:shadow-2xs"
                }`}
                title={isSidebarCollapsed ? "Dashboard Overview (Alt + 1)" : ""}
              >
                <LayoutGrid className={`w-5 h-5 shrink-0 transition-transform ${activeTab === "home" ? "text-white dark:text-slate-950" : "text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-teal-300 group-hover:scale-110"}`} />
                {!isSidebarCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="text-xs tracking-tight truncate">Dashboard Overview</span>
                    <kbd className={`px-1.5 py-0.5 text-[9px] font-mono rounded shadow-2xs font-bold ${activeTab === "home" ? "bg-white/20 dark:bg-slate-950/30 text-white dark:text-slate-950 border border-white/25 dark:border-slate-950/20" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-teal-800 dark:group-hover:text-teal-300 border border-slate-200 dark:border-slate-700"}`}>Alt+1</kbd>
                  </div>
                )}
              </button>
            )}

            {userRole === "admin" && (
              <button 
                onClick={() => setActiveTab("talent-pool")}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl transition-all text-left group ${
                  activeTab === "talent-pool" 
                    ? "bg-primary dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-md shadow-primary/25 translate-x-0.5" 
                    : "text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-teal-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 font-bold hover:shadow-2xs"
                }`}
                title={isSidebarCollapsed ? "Talent Pool Directory (Alt + 2)" : ""}
              >
                <Users className={`w-5 h-5 shrink-0 transition-transform ${activeTab === "talent-pool" ? "text-white dark:text-slate-950" : "text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-teal-300 group-hover:scale-110"}`} />
                {!isSidebarCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="text-xs tracking-tight truncate">Talent Directory</span>
                    <kbd className={`px-1.5 py-0.5 text-[9px] font-mono rounded shadow-2xs font-bold ${activeTab === "talent-pool" ? "bg-white/20 dark:bg-slate-950/30 text-white dark:text-slate-950 border border-white/25 dark:border-slate-950/20" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-teal-800 dark:group-hover:text-teal-300 border border-slate-200 dark:border-slate-700"}`}>Alt+2</kbd>
                  </div>
                )}
              </button>
            )}

            {userRole === "admin" && (
              <button 
                onClick={() => setActiveTab("nine-box")}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl transition-all text-left group ${
                  activeTab === "nine-box" 
                    ? "bg-primary dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-md shadow-primary/25 translate-x-0.5" 
                    : "text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-teal-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 font-bold hover:shadow-2xs"
                }`}
                title={isSidebarCollapsed ? "Nine-Box Matrix (Alt + 3)" : ""}
              >
                <Grid3X3 className={`w-5 h-5 shrink-0 transition-transform ${activeTab === "nine-box" ? "text-white dark:text-slate-950" : "text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-teal-300 group-hover:scale-110"}`} />
                {!isSidebarCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="text-xs tracking-tight truncate">Nine-Box Matrix</span>
                    <kbd className={`px-1.5 py-0.5 text-[9px] font-mono rounded shadow-2xs font-bold ${activeTab === "nine-box" ? "bg-white/20 dark:bg-slate-950/30 text-white dark:text-slate-950 border border-white/25 dark:border-slate-950/20" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-teal-800 dark:group-hover:text-teal-300 border border-slate-200 dark:border-slate-700"}`}>Alt+3</kbd>
                  </div>
                )}
              </button>
            )}

            <button 
              onClick={() => {
                setActiveTab("profile");
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl transition-all text-left group ${
                activeTab === "profile" 
                  ? "bg-primary dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-md shadow-primary/25 translate-x-0.5" 
                  : "text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-teal-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 font-bold hover:shadow-2xs"
              }`}
              title={isSidebarCollapsed ? "Detail Profil & IDP (Alt + 4)" : ""}
            >
              <User className={`w-5 h-5 shrink-0 transition-transform ${activeTab === "profile" ? "text-white dark:text-slate-950" : "text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-teal-300 group-hover:scale-110"}`} />
              {!isSidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="text-xs tracking-tight truncate">
                    {userRole === "admin" ? "Profile Details" : "Profil & IDP Saya"}
                  </span>
                  <kbd className={`px-1.5 py-0.5 text-[9px] font-mono rounded shadow-2xs font-bold ${activeTab === "profile" ? "bg-white/20 dark:bg-slate-950/30 text-white dark:text-slate-950 border border-white/25 dark:border-slate-950/20" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-teal-800 dark:group-hover:text-teal-300 border border-slate-200 dark:border-slate-700"}`}>Alt+4</kbd>
                </div>
              )}
            </button>

            {userRole === "admin" && (
              <button 
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl transition-all text-left group ${
                  activeTab === "settings" 
                    ? "bg-primary dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-md shadow-primary/25 translate-x-0.5" 
                    : "text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-teal-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 font-bold hover:shadow-2xs"
                }`}
                title={isSidebarCollapsed ? "Advisory Controls (Alt + 5)" : ""}
              >
                <Settings className={`w-5 h-5 shrink-0 transition-transform ${activeTab === "settings" ? "text-white dark:text-slate-950" : "text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-teal-300 group-hover:scale-110"}`} />
                {!isSidebarCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="text-xs tracking-tight truncate">Advisory Controls</span>
                    <kbd className={`px-1.5 py-0.5 text-[9px] font-mono rounded shadow-2xs font-bold ${activeTab === "settings" ? "bg-white/20 dark:bg-slate-950/30 text-white dark:text-slate-950 border border-white/25 dark:border-slate-950/20" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-teal-800 dark:group-hover:text-teal-300 border border-slate-200 dark:border-slate-700"}`}>Alt+5</kbd>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Bottom Controls & Shortcuts */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
            {/* Quick Command Palette Button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"} rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition-all shadow-2xs hover:shadow-xs cursor-pointer group`}
              title="Cari Talenta & Command Palette (Ctrl + K)"
            >
              <Command className="w-4 h-4 text-slate-600 dark:text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
              {!isSidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="text-[11px] truncate tracking-tight text-slate-800 dark:text-slate-100 font-bold">Cari & Actions</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 shadow-2xs font-bold">⌘K</kbd>
                </div>
              )}
            </button>

            {/* Keyboard Shortcuts Cheatsheet Button */}
            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"} rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition-all shadow-2xs hover:shadow-xs cursor-pointer group`}
              title="Petunjuk Shortcut Keyboard (?)"
            >
              <Keyboard className="w-4 h-4 text-slate-600 dark:text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
              {!isSidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="text-[11px] truncate tracking-tight text-slate-800 dark:text-slate-100 font-bold">Shortcut Keys</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 shadow-2xs font-bold">?</kbd>
                </div>
              )}
            </button>

            <button 
              onClick={() => setAuthState("landing")}
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2"} rounded-xl text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-all text-left font-bold cursor-pointer group`}
              title={isSidebarCollapsed ? "Logout Portal" : ""}
            >
              <ArrowLeft className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              {!isSidebarCollapsed && <span className="font-bold text-rose-600 dark:text-rose-400">Logout Portal</span>}
            </button>
          </div>
        </aside>

        {/* Main Scrollable Content Area */}
        <main className="flex-1 px-5 md:px-8 py-6 pb-28 md:pb-8 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Breadcrumbs & Actions Header (Desktop) */}
            <div className="hidden md:flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-on-surface-variant text-sm font-medium">
                {userRole === "admin" ? (
                  <>
                    <button 
                      onClick={() => setActiveTab("talent-pool")}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Talent Pool
                    </button>
                    {activeTab === "profile" && (
                      <>
                        <ChevronRight className="w-4 h-4 text-outline" />
                        <span className="text-primary font-semibold">{currentTalent.name}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-on-surface-variant">Profil Saya</span>
                    <ChevronRight className="w-4 h-4 text-outline" />
                    <span className="text-primary font-semibold">{currentTalent.name} (Karyawan)</span>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Edit Profil Lengkap Button */}
                {activeTab === "profile" && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleOpenEditProfile}
                      className="h-8.5 px-3 bg-white hover:bg-surface-container-low text-secondary border border-surface-container-highest shadow-2xs font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      title="Edit Profil Lengkap Talenta"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-primary" />
                      <span>Edit Profil</span>
                    </button>
                    {userRole === "admin" && (
                      <button 
                        onClick={() => handleDeleteTalent(currentTalent.id, currentTalent.name)}
                        className="h-8.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shadow-2xs font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        title="Hapus Talenta dari Master System"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Adjust Scores Simulator Button - Admin Only */}
                {userRole === "admin" && (
                  <button 
                    onClick={() => setIsEditingScores(!isEditingScores)}
                    className={`h-8.5 px-3 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                      isEditingScores 
                        ? "bg-amber-600 text-white shadow-xs hover:bg-amber-700" 
                        : "bg-white text-secondary border border-surface-container-highest shadow-2xs hover:bg-surface-container-low"
                    }`}
                    title="Mode Edit Skor / Simulasi Metrics Assessment"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isEditingScores ? "Lock Metrics" : "Edit Skor"}</span>
                  </button>
                )}

                <div className="h-4 w-px bg-surface-container-highest mx-0.5 hidden sm:block"></div>

                <button 
                  onClick={() => setIsOverallSummaryModalOpen(true)}
                  className="h-8.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Cetak & Unduh Summary Report Keseluruhan Data System"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Summary System</span>
                </button>

                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="h-8.5 px-3.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Download Laporan Individual PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button 
                  onClick={() => handleOpenSendEmail("summary")}
                  className="h-8.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border border-amber-400"
                  title="Kirim Laporan Summary / Individual via Email Gateway"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-950" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* TAB PANELS WITH ANIMATIONS */}
            <AnimatePresence mode="wait" custom={direction}>
              
              {/* 1. DASHBOARD VIEW */}
              {activeTab === "home" && (
                <motion.div
                  key="home"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="border-b border-surface-container-highest pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-primary">Strategic Talent Dashboard</h1>
                        {highUrgencyPositionsWithoutReadySuccessor.length > 0 && (
                          <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/40 flex items-center gap-1 shrink-0">
                            <AlertCircle className="w-3 h-3" />
                            <span>{highUrgencyPositionsWithoutReadySuccessor.length} Risiko Kritis</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant mt-1">Real-time analytical representation of your succession pool, readiness metrics, and leadership development plans.</p>
                    </div>
                    {/* Sub-tabs toggle */}
                    <div className="flex bg-surface-container-high rounded-lg p-1 border border-surface-container-highest self-start md:self-center">
                      <button
                        onClick={() => setDashboardSubTab("analytics")}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          dashboardSubTab === "analytics"
                            ? "bg-white text-primary shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        ANALISIS & METRIK UTAMA
                      </button>
                      <button
                        onClick={() => setDashboardSubTab("retirement")}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                          dashboardSubTab === "retirement"
                            ? "bg-white text-primary shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        PETA SUKSESI PENSIUN
                      </button>
                    </div>
                  </div>

                  {/* Succession Risk Alert Banner */}
                  {highUrgencyPositionsWithoutReadySuccessor.length > 0 && (
                    <div className="bg-rose-50 border border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30 rounded-xl p-4.5 flex flex-col md:flex-row items-start gap-4 transition-all shadow-sm">
                      <div className="p-2.5 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                          ⚠️ Peringatan Risiko Kepemimpinan: Posisi Kunci Belum Terproteksi
                        </h4>
                        <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                          Terdapat <strong className="font-bold">{highUrgencyPositionsWithoutReadySuccessor.length} posisi suksesi kunci berkategori urgensi "High"</strong> yang belum memiliki suksesor berstatus <strong className="font-bold">Ready Now (Siap Sekarang)</strong>. Segera lakukan akselerasi kompetensi atau penunjukan suksesor alternatif untuk menghindari celah kepemimpinan.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {highUrgencyPositionsWithoutReadySuccessor.map((pos) => {
                            const succ = pos.assignedSuccessorId ? talents.find(t => t.id === pos.assignedSuccessorId) : null;
                            return (
                              <div key={pos.id} className="bg-white/90 dark:bg-slate-900/80 border border-rose-200/50 dark:border-rose-900/40 rounded-lg px-3 py-2 text-xs flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 shadow-2xs">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{pos.positionName}</span>
                                <span className="hidden sm:inline text-slate-300">|</span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Divisi: <strong className="text-slate-700 dark:text-slate-300">{pos.division}</strong>
                                </span>
                                <span className="hidden sm:inline text-slate-300">|</span>
                                <span className={`text-[10px] font-bold ${succ ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                                  {succ ? `Suksesor: ${succ.name} (${succ.readiness})` : "Belum ada Suksesor Terpilih"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {dashboardSubTab === "analytics" ? (
                    <>
                      {/* KPI Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-surface-container-highest shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider block">Total Talents</span>
                            <span className="text-2xl font-bold text-on-surface">{totalTalents}</span>
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-surface-container-highest shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider block">Ready Immediately</span>
                            <span className="text-2xl font-bold text-emerald-600">{readyNowCount}</span>
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-surface-container-highest shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                            <Brain className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider block">Avg Analytics Score</span>
                            <span className="text-2xl font-bold text-on-surface">{avgLogicalScore}%</span>
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-surface-container-highest shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider block">Avg Leadership Score</span>
                            <span className="text-2xl font-bold text-on-surface">{avgLeadershipScore}%</span>
                          </div>
                        </div>
                      </div>

                      {/* QUICK INSIGHTS CARDS - Auto Highlights Top 3 Highest & Top 3 Lowest Rated Talents */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-surface-container-highest dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div>
                            <h3 className="font-display text-base font-bold text-on-surface dark:text-slate-100 flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-amber-500" />
                              <span>Quick Insights: Heatmap Talent Highlights</span>
                            </h3>
                            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
                              Sorotan otomatis 3 talenta dengan rating tertinggi (Top Star Performers) dan 3 talenta terendah (Need Attention) berdasarkan data evaluasi matriks & heatmap terkini.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Live Auto-Calculated
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          {/* Top 3 Highest Rated Card */}
                          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 p-4 space-y-3">
                            <div className="flex justify-between items-center pb-2.5 border-b border-emerald-200/60 dark:border-emerald-800/40">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs">
                                  <Award className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black uppercase text-emerald-950 dark:text-emerald-200 tracking-wider">
                                    Top 3 Highest-Rated Talents
                                  </h4>
                                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Rating Kinerja & Potensi Tertinggi</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                                Star Performers
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {quickInsightsData.topHighest.map((item, index) => (
                                <div 
                                  key={item.talent.id}
                                  onClick={() => {
                                    setSelectedTalentId(item.talent.id);
                                    setActiveTab("profile");
                                  }}
                                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                      <img src={item.talent.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-2xs" referrerPolicy="no-referrer" />
                                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                                        #{index + 1}
                                      </span>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                          {item.talent.name}
                                        </h5>
                                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0 border border-emerald-200 dark:border-emerald-800">
                                          {item.cellName}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {item.talent.title} • <strong className="text-slate-700 dark:text-slate-300">{item.talent.division}</strong>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                      {item.overallRating}% <span className="text-[9px] font-sans font-medium text-emerald-600/80 dark:text-emerald-400/80">Rating</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                                      Perf: {item.perfScore}% | Pot: {item.potScore}%
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Top 3 Lowest Rated Card */}
                          <div className="bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-800/50 p-4 space-y-3">
                            <div className="flex justify-between items-center pb-2.5 border-b border-rose-200/60 dark:border-rose-800/40">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-rose-600 text-white rounded-lg shadow-2xs">
                                  <ShieldAlert className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black uppercase text-rose-950 dark:text-rose-200 tracking-wider">
                                    Top 3 Lowest-Rated Talents
                                  </h4>
                                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">Membutuhkan Bimbingan & Pendampingan</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-black uppercase text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-700">
                                Need Attention
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {quickInsightsData.topLowest.map((item, index) => (
                                <div 
                                  key={item.talent.id}
                                  onClick={() => {
                                    setSelectedTalentId(item.talent.id);
                                    setActiveTab("profile");
                                  }}
                                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                      <img src={item.talent.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-rose-500 shadow-2xs" referrerPolicy="no-referrer" />
                                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                                        #{index + 1}
                                      </span>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">
                                          {item.talent.name}
                                        </h5>
                                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 shrink-0 border border-rose-200 dark:border-rose-800">
                                          {item.cellName}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {item.talent.title} • <strong className="text-slate-700 dark:text-slate-300">{item.talent.division}</strong>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="text-xs font-black font-mono text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                      {item.overallRating}% <span className="text-[9px] font-sans font-medium text-rose-600/80 dark:text-rose-400/80">Rating</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                                      Perf: {item.perfScore}% | Pot: {item.potScore}%
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* High-Potential Talents Distribution Chart Card */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-surface-container-highest dark:border-slate-800 p-6 shadow-sm space-y-6">
                        <div>
                          <h3 className="font-display text-lg font-bold text-on-surface dark:text-slate-100 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <span>Distribusi Talenta Potensi Tinggi per Departemen</span>
                          </h3>
                          <p className="text-xs text-on-surface-variant dark:text-slate-300 mt-1">
                            Visualisasi sebaran suksesor potensial (Sumbu X Tinggi) dibandingkan dengan total suksesor di setiap bidang untuk membantu identifikasi celah kepemimpinan.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                          {/* Chart Column - Height adjusted for clear view */}
                          <div className="lg:col-span-2 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                            <div className="h-[330px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={highPotentialDistributionData}
                                  margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                                  <XAxis 
                                    dataKey="shortDivision" 
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"} 
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={0}
                                  />
                                  <YAxis 
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"} 
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                                      borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                                      borderRadius: "8px",
                                      fontSize: "11px",
                                      color: isDarkMode ? "#f8fafc" : "#0f172a"
                                    }}
                                    labelFormatter={(label: any, payload: any[]) => {
                                      if (payload && payload.length > 0 && payload[0].payload) {
                                        const item = payload[0].payload;
                                        return `${item.division} (${item.shortDivision})`;
                                      }
                                      return label;
                                    }}
                                    cursor={{ fill: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}
                                  />
                                  <Legend 
                                    verticalAlign="top" 
                                    align="right"
                                    height={36} 
                                    iconType="circle" 
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: "11px", color: isDarkMode ? "#e2e8f0" : "#334155" }}
                                  />
                                  <Bar 
                                    name="Potensi Tinggi (High Potential)" 
                                    dataKey="highPotentialCount" 
                                    fill={isDarkMode ? "#2dd4bf" : "#005454"} 
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                  />
                                  <Bar 
                                    name="Talenta Lainnya" 
                                    dataKey="otherCount" 
                                    fill={isDarkMode ? "#475569" : "#cbd5e1"} 
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Analytical Callouts Column - Scrollable and sized to match chart */}
                          <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Analisis Kepadatan Bakat</span>
                              </h4>
                              
                              <div className="space-y-3">
                                <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                                  <span className="text-xs text-slate-600 dark:text-slate-300">Total Departemen</span>
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{highPotentialDistributionData.length}</span>
                                </div>
                                <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                                  <span className="text-xs text-slate-600 dark:text-slate-300">Departemen Berpotensi Tinggi</span>
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {highPotentialDistributionData.filter(d => d.highPotentialCount > 0).length}
                                  </span>
                                </div>
                                <div className="flex items-baseline justify-between pb-1">
                                  <span className="text-xs text-slate-600 dark:text-slate-300">Celah Bakat Teridentifikasi</span>
                                  <span className={`text-xs font-bold ${talentGapAnalysis.gaps.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    {talentGapAnalysis.gaps.length} Bidang
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Dynamic Talent Gap Warnings */}
                            {talentGapAnalysis.gaps.length > 0 ? (
                              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                  <span>Identifikasi Celah Bakat</span>
                                </h4>
                                <p className="text-[11px] text-rose-800 dark:text-rose-200 leading-relaxed">
                                  Departemen berikut belum memiliki suksesor berkategori <strong className="text-rose-950 dark:text-white font-bold">High Potential</strong>:
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {talentGapAnalysis.gaps.map((gap, idx) => (
                                    <span key={idx} className="bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                      {gap}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-[10px] text-rose-700 dark:text-rose-300 mt-2.5 italic">
                                  *Rekomendasi: Lakukan rotasi silang jabatan atau optimalkan IDP untuk akselerasi kompetensi pimpinan.
                                </p>
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
                                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>Keberlanjutan Kuat</span>
                                </h4>
                                <p className="text-[11px] text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                  Selamat! Semua departemen aktif saat ini telah memiliki setidaknya satu suksesor berpotensi tinggi (<strong className="text-emerald-950 dark:text-white font-bold">High Potential</strong>).
                                </p>
                              </div>
                            )}

                            {/* Strong Succession Pipeline */}
                            {talentGapAnalysis.strong.length > 0 && (
                              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Kekuatan Utama</span>
                                </h4>
                                <p className="text-[11px] text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                  <strong className="text-emerald-950 dark:text-white font-bold">{talentGapAnalysis.strong.join(", ")}</strong> memiliki keunggulan suksesi yang kuat (≥50% talenta adalah High Potential).
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Trend Analysis Chart Card */}
                      <div className="bg-white rounded-xl border border-surface-container-highest p-6 shadow-sm space-y-6">
                        <div>
                          <h3 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <span>Analisis Tren Kinerja Organisasi (FY 2020 - FY 2024)</span>
                          </h3>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Pelacakan rata-rata skor evaluasi kinerja seluruh talenta selama 5 tahun fiskal terakhir untuk memantau perkembangan kompetensi jangka panjang organisasi.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                          {/* Chart Column */}
                          <div className="lg:col-span-2 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                            <div className="h-[330px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={performanceTrendData}
                                  margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                                  <XAxis 
                                    dataKey="year" 
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"} 
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <YAxis 
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"} 
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[1, 5]}
                                    tickCount={5}
                                  />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md text-xs">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">{data.year}</p>
                                            <div className="space-y-1">
                                              <p className="text-primary font-semibold">
                                                Rata-rata Rating: <span className="font-mono">{data.averageRating.toFixed(2)} / 5.00</span>
                                              </p>
                                              <p className="text-slate-500 dark:text-slate-400">
                                                Konversi Persentase: <span className="font-mono">{data.percentage}%</span>
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Legend 
                                    verticalAlign="top" 
                                    align="right"
                                    height={36} 
                                    iconType="circle" 
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: "11px", color: isDarkMode ? "#e2e8f0" : "#334155" }}
                                  />
                                  <Line 
                                    name="Rata-rata Evaluasi Kinerja (1-5)" 
                                    type="monotone"
                                    dataKey="averageRating" 
                                    stroke={isDarkMode ? "#2dd4bf" : "#005454"} 
                                    strokeWidth={3}
                                    dot={{ r: 5, strokeWidth: 2, fill: isDarkMode ? "#0f172a" : "#ffffff" }}
                                    activeDot={{ r: 8 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Insights Column */}
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800/60">
                              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <History className="w-4 h-4 text-primary" />
                                <span>Metrik Utama Organisasi</span>
                              </h4>
                              
                              <div className="space-y-3">
                                <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 pb-2">
                                  <span className="text-xs text-on-surface-variant font-medium">Kinerja Awal (FY 2020)</span>
                                  <span className="text-xs font-bold text-on-surface font-mono">
                                    {performanceTrendData[0]?.averageRating.toFixed(2)} / 5.00
                                  </span>
                                </div>
                                <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 pb-2">
                                  <span className="text-xs text-on-surface-variant font-medium">Kinerja Akhir (FY 2024)</span>
                                  <span className="text-xs font-bold text-primary font-mono">
                                    {performanceTrendData[performanceTrendData.length - 1]?.averageRating.toFixed(2)} / 5.00
                                  </span>
                                </div>
                                <div className="flex items-baseline justify-between pb-1">
                                  <span className="text-xs text-on-surface-variant font-medium">Perubahan Kumulatif</span>
                                  <span className={`text-xs font-bold flex items-center gap-1 font-mono ${
                                    trendAnalytics.direction === "up" ? "text-emerald-600" : trendAnalytics.direction === "down" ? "text-rose-600" : "text-slate-600"
                                  }`}>
                                    {trendAnalytics.direction === "up" ? "+" : trendAnalytics.direction === "down" ? "-" : ""}
                                    {trendAnalytics.percentageChange}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Dynamic Insight Advice */}
                            <div className={`p-4 rounded-xl border ${
                              trendAnalytics.direction === "up" 
                                ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30" 
                                : trendAnalytics.direction === "down"
                                ? "bg-rose-50 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30"
                                : "bg-slate-50 border-slate-100 dark:bg-slate-950/10 dark:border-slate-900/30"
                            }`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                                trendAnalytics.direction === "up" ? "text-emerald-800 dark:text-emerald-300" : trendAnalytics.direction === "down" ? "text-rose-800 dark:text-rose-300" : "text-slate-800 dark:text-slate-300"
                              }`}>
                                <Sparkles className="w-4 h-4" />
                                <span>Rangkuman Analitis HR</span>
                              </h4>
                              <p className={`text-[11px] leading-relaxed ${
                                trendAnalytics.direction === "up" ? "text-emerald-700 dark:text-emerald-300" : trendAnalytics.direction === "down" ? "text-rose-700 dark:text-rose-300" : "text-slate-700 dark:text-slate-300"
                              }`}>
                                {trendAnalytics.message}
                              </p>
                              <div className="mt-3 pt-2.5 border-t border-dashed border-current/10 text-[10px] opacity-80 leading-normal italic">
                                *Data tren didasarkan pada total riwayat kinerja seluruh talent pool suksesi yang aktif saat ini.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Skill Gap Heatmap Card */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-surface-container-highest dark:border-slate-800 p-6 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-display text-lg font-bold text-on-surface dark:text-slate-100 flex items-center gap-2">
                              <Grid3X3 className="w-5 h-5 text-primary" />
                              <span>Skill Gap Heatmap (Target Kompetensi Manajerial)</span>
                            </h3>
                            <p className="text-xs text-on-surface-variant dark:text-slate-300 mt-1">
                              Menganalisis kesenjangan (gap) antara rata-rata tingkat kompetensi talenta saat ini (skala 1-5) dengan standar kompetensi yang dipersyaratkan untuk posisi manajemen.
                            </p>
                          </div>
                          
                          {/* Interactive Target Selector */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <span className="text-xs font-semibold text-on-surface-variant dark:text-slate-300">Target Manajemen:</span>
                            <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                              {[3.5, 4.0, 4.5].map((target) => (
                                <button
                                  key={target}
                                  onClick={() => setManagerialTarget(target)}
                                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                    managerialTarget === target
                                      ? "bg-primary text-white dark:text-slate-950 font-extrabold shadow-sm"
                                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                  }`}
                                >
                                  {target === 3.5 ? "3.5 (Basic)" : target === 4.0 ? "4.0 (Standard)" : "4.5 (Senior)"}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Heatmap Toolbar & Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
                            {/* Search Input */}
                            <div className="relative flex-1 min-w-[150px]">
                              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Cari Departemen / Divisi..."
                                value={heatmapSearch}
                                onChange={(e) => setHeatmapSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100"
                              />
                              {heatmapSearch && (
                                <button
                                  onClick={() => setHeatmapSearch("")}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Department Filter */}
                            <select
                              value={heatmapDeptFilter}
                              onChange={(e) => setHeatmapDeptFilter(e.target.value)}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary cursor-pointer"
                            >
                              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="All">Semua Departemen ({skillGapHeatmapData.divisions.length})</option>
                              {skillGapHeatmapData.divisions.map((div) => (
                                <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" key={div} value={div}>{div}</option>
                              ))}
                            </select>

                            {/* Gap Filter */}
                            <select
                              value={heatmapGapFilter}
                              onChange={(e) => setHeatmapGapFilter(e.target.value)}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary cursor-pointer"
                            >
                              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="All">Semua Status Gap</option>
                              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Critical">🚨 Gap Kritis (&lt; -0.5)</option>
                              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="HasGap">⚠️ Memiliki Celah (&lt; 0)</option>
                              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="NoGap">✅ Sesuai Target (≥ 0)</option>
                            </select>
                          </div>

                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            {filteredHeatmapRows.length} dari {skillGapHeatmapData.heatmap.length} Divisi
                          </span>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                          {/* Heatmap Grid - Height matched to 360px scrollable container */}
                          <div className="xl:col-span-2 overflow-x-auto overflow-y-auto max-h-[360px] border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/20 custom-scrollbar relative">
                            <table className="w-full border-collapse text-left text-xs min-w-[1250px]">
                              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-xs">
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                  <th className="p-3 font-bold text-slate-800 dark:text-slate-200 min-w-[200px]">Departemen / Divisi</th>
                                  {skillGapHeatmapData.competenciesList.map((comp) => (
                                    <th key={comp} className="p-2.5 font-bold text-slate-800 dark:text-slate-200 text-center min-w-[110px] text-[11px] whitespace-nowrap">
                                      {comp}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {filteredHeatmapRows.length === 0 ? (
                                  <tr>
                                    <td colSpan={skillGapHeatmapData.competenciesList.length + 1} className="p-8 text-center text-slate-400 dark:text-slate-500 italic font-medium">
                                      Tidak ada departemen yang sesuai dengan filter pencarian.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredHeatmapRows.map((row) => (
                                  <tr key={row.division} className="border-b border-slate-200 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                                      <div>{row.division}</div>
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">{row.talentsCount} Talenta Suksesi</div>
                                    </td>
                                    {row.competencyGaps.map((g) => {
                                      const isCritical = g.gap < -0.5;
                                      const isMinor = g.gap < 0 && g.gap >= -0.5;

                                      return (
                                        <td key={g.competencyName} className="p-2 text-center">
                                          <div className={`p-2.5 rounded-lg border flex flex-col items-center justify-center transition-all ${
                                            isCritical 
                                              ? "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800/60" 
                                              : isMinor
                                              ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/60"
                                              : "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/60"
                                          }`}>
                                            <span className="font-mono font-bold text-sm">{g.avgRating.toFixed(2)}</span>
                                            <span className="text-[9px] opacity-90 mt-0.5 font-medium">Target: {managerialTarget.toFixed(1)}</span>
                                            
                                            <span className={`text-[10px] font-black mt-1 px-1.5 py-0.5 rounded ${
                                              isCritical
                                                ? "bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100"
                                                : isMinor
                                                ? "bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100"
                                                : "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100"
                                            }`}>
                                              {g.gap >= 0 ? `+${g.gap}` : g.gap} Gap
                                            </span>

                                            {g.belowTargetCount > 0 && (
                                              <div className="mt-1.5 text-[8px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-t border-dashed border-current/25 pt-1 w-full text-center font-medium">
                                                {g.belowTargetCount} talenta &lt; target
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Analysis and Recommendations Column - Height matched to 360px scrollable container */}
                          <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span>Rangkuman Analisis Gap</span>
                              </h4>
                              
                              <div className="space-y-3 text-xs">
                                <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                                  <span className="text-slate-600 dark:text-slate-300 font-medium">Total Celah Terdeteksi</span>
                                  <span className={`font-bold font-mono ${skillGapSummary.totalGapsCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    {skillGapSummary.totalGapsCount} Area Kesenjangan
                                  </span>
                                </div>
                                {skillGapSummary.totalGapsCount > 0 && (
                                  <>
                                    <div className="flex flex-col gap-1 border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                                      <span className="text-slate-600 dark:text-slate-300 font-medium">Celah Terbesar (Kritis)</span>
                                      <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                                        -{skillGapSummary.largestNegativeGap.toFixed(2)} Gap
                                      </span>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                                        Kompetensi <strong className="text-slate-800 dark:text-slate-100">{skillGapSummary.worstComp}</strong> di <strong className="text-slate-800 dark:text-slate-100">{skillGapSummary.worstDiv}</strong>
                                      </span>
                                    </div>
                                  </>
                                )}
                                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                  <div className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
                                  <span>Gap &lt; -0.5 : Celah Kritis (Butuh Intervensi)</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                  <div className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0" />
                                  <span>Gap -0.5 s/d 0 : Celah Ringan (Pengembangan)</span>
                                </div>
                              </div>
                            </div>

                            {/* Dynamic Action Plan & Recommendations */}
                            {skillGapSummary.totalGapsCount > 0 ? (
                              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  <span>Rencana Aksi Intervensi HR</span>
                                </h4>
                                
                                <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed mb-3">
                                  Berdasarkan kesenjangan di atas, berikut adalah rekomendasi program pengembangan untuk meningkatkan kecocokan jabatan manajerial:
                                </p>

                                <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                  {skillGapHeatmapData.heatmap.map((row) => {
                                    // Find competencies with gaps in this division
                                    const gaps = row.competencyGaps.filter(g => g.gap < 0);
                                    if (gaps.length === 0) return null;

                                    return (
                                      <div key={row.division} className="bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
                                        <div className="font-bold text-[10px] text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1">{row.division}</div>
                                        <div className="space-y-1.5">
                                          {gaps.map((g) => {
                                            let recommendation = "";
                                            if (g.competencyName === "Business Knowledge") recommendation = "Corporate Strategic Management Program";
                                            else if (g.competencyName === "Leadership") recommendation = "Executive Leadership Program & Coaching";
                                            else if (g.competencyName === "Problem Solving") recommendation = "Problem Solving & Critical Thinking Workshop";
                                            else if (g.competencyName === "Interpersonal Skill") recommendation = "Advanced Interpersonal & Stakeholder Management";
                                            else if (g.competencyName === "Strategic Mindset") recommendation = "Strategic Thinking & Vision Alignment Masterclass";
                                            else if (g.competencyName === "Manages Complexity") recommendation = "Managing Complexity & Operational Excellence Training";
                                            else if (g.competencyName === "Ensures Accountability") recommendation = "Performance Governance & Accountability Training";
                                            else if (g.competencyName === "Drives Vision") recommendation = "Visionary Leadership & Change Management Masterclass";
                                            else if (g.competencyName === "Cultivate Innovation") recommendation = "Design Thinking & Cultivating Innovation Workshop";
                                            else recommendation = "Advanced Managerial Competency Program";

                                            return (
                                              <div key={g.competencyName} className="text-[9px] text-slate-700 dark:text-slate-300 leading-normal">
                                                <div>• <strong className="text-amber-900 dark:text-amber-300 font-bold">{g.competencyName}</strong>: <span className="italic">{recommendation}</span></div>
                                                <div className="pl-2.5 text-[8.5px] text-slate-500 dark:text-slate-400 font-medium">
                                                  Target Karyawan: {g.belowTargetTalents.map(t => t.name).join(", ")}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
                                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>Kompetensi Sangat Kuat</span>
                                </h4>
                                <p className="text-[11px] text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                  Semua departemen rata-rata telah memenuhi atau melampaui target standar kompetensi manajerial ({managerialTarget.toFixed(1)}/5.0).
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Succession Map / 9-Box Placement Overview */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Active Succession Candidates */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-container-highest p-6 shadow-sm flex flex-col">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div>
                              <h3 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                                <span>Succession Candidates</span>
                                <span className="bg-primary-container/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
                                  {filteredActiveCandidates.length} Active
                                </span>
                              </h3>
                              <p className="text-xs text-on-surface-variant mt-0.5">Profiles prioritized for upcoming critical strategic transformation and C-suite placement positions.</p>
                            </div>
                          </div>

                          {/* Candidate Filters */}
                          <div className="flex flex-wrap items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                            <div className="relative flex-1 min-w-[140px]">
                              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Cari Nama / Jabatan..."
                                value={activeCandidateSearch}
                                onChange={(e) => setActiveCandidateSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-primary text-on-surface"
                              />
                            </div>

                            <select
                              value={activeCandidateDivisionFilter}
                              onChange={(e) => setActiveCandidateDivisionFilter(e.target.value)}
                              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer max-w-[160px] truncate"
                            >
                              <option value="All">Semua Divisi</option>
                              {Array.from(new Set(talents.map(t => t.division))).map(div => (
                                <option key={div} value={div}>{div}</option>
                              ))}
                            </select>

                            <select
                              value={activeCandidateReadinessFilter}
                              onChange={(e) => setActiveCandidateReadinessFilter(e.target.value)}
                              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                            >
                              <option value="All">Semua Kesiapan</option>
                              <option value="Ready Now">Ready Now</option>
                              <option value="1-2 Years">1-2 Years</option>
                              <option value="3-5 Years">3-5 Years</option>
                            </select>
                          </div>
                          
                          {/* Compact Scroll Container */}
                          <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1 flex-1">
                            {filteredActiveCandidates.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 italic text-xs">
                                Tidak ada kandidat suksesi yang sesuai dengan kriteria filter.
                              </div>
                            ) : (
                              filteredActiveCandidates.map((t) => (
                              <div 
                                key={t.id}
                                onClick={() => {
                                  setSelectedTalentId(t.id);
                                  setActiveTab("profile");
                                }}
                                className="p-4 rounded-xl border border-surface-container-highest bg-surface hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-4">
                                  <img src={t.avatar} className="w-12 h-12 rounded-full object-cover border border-surface shadow-sm" alt={t.name} referrerPolicy="no-referrer" />
                                  <div>
                                    <h4 className="font-display font-bold text-sm text-on-surface hover:text-primary transition-colors">{t.name}</h4>
                                    <p className="text-xs text-on-surface-variant">{t.title}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-xs text-on-surface-variant font-semibold bg-white border border-surface-container-highest px-3 py-1 rounded-full">
                                    {t.division}
                                  </span>
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                    t.readinessColor === "emerald" 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : t.readinessColor === "amber"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}>
                                    {t.readiness}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-outline-variant hidden sm:block" />
                                </div>
                              </div>
                            ))
                            )}
                          </div>
                        </div>

                        {/* Succession Health & Talent Matrix Insights */}
                        <div className="bg-white rounded-xl border border-surface-container-highest p-6 shadow-sm flex flex-col justify-between">
                          <div>
                            <h3 className="font-display text-lg font-bold text-on-surface mb-2">Talent Advisory Summary</h3>
                            <p className="text-xs text-on-surface-variant mb-6">Automated structural observations regarding the strategic pool health indexes.</p>
                            
                            <div className="space-y-4 text-sm">
                              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <strong className="text-emerald-900 block font-semibold text-xs">Strong Successor Density</strong>
                                  <span className="text-xs text-emerald-800">25% of candidates are labeled &quot;READY NOW&quot;, ensuring high strategic continuity.</span>
                                </div>
                              </div>

                              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <strong className="text-amber-900 block font-semibold text-xs">Critical Tenure Check</strong>
                                  <span className="text-xs text-amber-800">Average tenure sits at 5.25 years. Middle-tier executive engagement campaigns recommended.</span>
                                </div>
                              </div>

                              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-start gap-3">
                                <Brain className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <strong className="text-indigo-900 block font-semibold text-xs">Competency Dominance</strong>
                                  <span className="text-xs text-indigo-800">Strategic Mindset holds the highest mastery index, validating robust long-term vision.</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => setActiveTab("talent-pool")}
                            className="w-full mt-6 bg-primary text-white font-bold text-xs py-3 rounded-lg hover:bg-primary/95 transition-all text-center flex items-center justify-center gap-2 animate-none"
                          >
                            <Users className="w-4 h-4" />
                            ACCESS EXECUTIVE DIRECTORY
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* RETIREMENT SUCCESSION MATRIX & MATCHER ENGINE */
                    <div className="space-y-6 text-left">
                      {/* Header banner */}
                      <div className="bg-gradient-to-r from-primary/10 via-primary-container/5 to-transparent p-6 rounded-xl border border-primary/20 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <div className="space-y-1">
                          <h2 className="font-display text-lg font-extrabold text-primary uppercase tracking-wide flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Peta Suksesi & Manajemen Masa Pensiun Eksekutif
                          </h2>
                          <p className="text-xs text-on-surface-variant max-w-2xl">
                            Sistem integrasi dinamis data talent untuk mengisi posisi Top Management yang mendekati masa pensiun. Klik posisi untuk menganalisis suksesor potensial terbaik dari Talent Pool.
                          </p>
                        </div>

                        {/* Action buttons bar */}
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            ref={retiringImportInputRef}
                            accept=".json,.csv"
                            onChange={handleImportRetiringPositionsFile}
                            className="hidden"
                          />
                          
                          {/* Export buttons */}
                          <div className="flex rounded-lg shadow-2xs border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                            <button
                              onClick={handleExportRetiringPositionsJSON}
                              className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer border-r border-slate-200 dark:border-slate-700"
                              title="Unduh Peta Suksesi ke format JSON"
                            >
                              <Download className="w-3.5 h-3.5 text-primary" />
                              <span>Unduh JSON</span>
                            </button>
                            <button
                              onClick={handleExportRetiringPositionsCSV}
                              className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Unduh Peta Suksesi ke format CSV / Excel"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Unduh CSV</span>
                            </button>
                          </div>

                          {/* Import button */}
                          {userRole === "admin" && (
                            <button
                              onClick={() => retiringImportInputRef.current?.click()}
                              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                              title="Import data Peta Suksesi dari berkas JSON / CSV"
                            >
                              <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Impor Suksesi</span>
                            </button>
                          )}

                          {/* Supabase buttons */}
                          <div className="flex rounded-lg shadow-2xs border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                            <button
                              onClick={handlePushToSupabase}
                              disabled={isSupabaseSyncing}
                              className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer border-r border-slate-200 dark:border-slate-700 disabled:opacity-50"
                              title="Unggah dan simpan Peta Suksesi ke Supabase"
                            >
                              <Database className="w-3.5 h-3.5 text-amber-500" />
                              <span>Push Supabase</span>
                            </button>
                            <button
                              onClick={handlePullFromSupabase}
                              disabled={isSupabaseSyncing}
                              className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Tarik data terbaru Peta Suksesi dari Supabase"
                            >
                              <Cloud className="w-3.5 h-3.5 text-sky-500" />
                              <span>Pull Supabase</span>
                            </button>
                          </div>

                          {userRole === "admin" && (
                            <button
                              onClick={() => setIsAddRetiringPositionOpen(true)}
                              className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                              <span>POSISI BARU</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Main Succession Matrix Board */}
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Left column: Retiring Positions (2/5) */}
                        <div className="lg:col-span-2 space-y-3 flex flex-col">
                          <div className="flex justify-between items-center pb-2 border-b border-surface-container-highest">
                            <h3 className="font-display font-bold text-xs text-primary uppercase tracking-wider">
                              Posisi Top Management (Retiring List)
                            </h3>
                            <span className="bg-surface-container-highest text-on-surface-variant font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {retiringPositions.length} Posisi
                            </span>
                          </div>

                          {/* Retiring Positions Filters */}
                          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                            <div className="relative flex-1 min-w-[120px]">
                              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Cari Posisi / Petahana..."
                                value={retiringPosSearch}
                                onChange={(e) => setRetiringPosSearch(e.target.value)}
                                className="w-full pl-7 pr-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-primary text-on-surface"
                              />
                            </div>
                            <select
                              value={retiringPosUrgencyFilter}
                              onChange={(e) => setRetiringPosUrgencyFilter(e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                            >
                              <option value="All">Urgency</option>
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                            <select
                              value={retiringPosStatusFilter}
                              onChange={(e) => setRetiringPosStatusFilter(e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                            >
                              <option value="All">Status Suksesor</option>
                              <option value="Assigned">Ada Suksesor</option>
                              <option value="Unassigned">Belum Ada</option>
                            </select>
                          </div>

                          {/* Compact Scrollable List */}
                          <div className="space-y-2.5 overflow-y-auto max-h-[350px] custom-scrollbar pr-1 flex-1">
                            {retiringPositions
                              .filter((pos) => {
                                if (retiringPosSearch.trim() !== "") {
                                  const q = retiringPosSearch.toLowerCase();
                                  const match = pos.positionName.toLowerCase().includes(q) || pos.currentIncumbent.toLowerCase().includes(q) || pos.division.toLowerCase().includes(q);
                                  if (!match) return false;
                                }
                                if (retiringPosUrgencyFilter !== "All" && pos.urgency !== retiringPosUrgencyFilter) return false;
                                if (retiringPosStatusFilter === "Assigned" && !pos.assignedSuccessorId) return false;
                                if (retiringPosStatusFilter === "Unassigned" && pos.assignedSuccessorId) return false;
                                return true;
                              })
                              .length === 0 ? (
                              <div className="p-6 text-center text-slate-400 italic text-xs">
                                Tidak ada posisi pensiun yang sesuai kriteria filter.
                              </div>
                            ) : (
                              retiringPositions
                              .filter((pos) => {
                                if (retiringPosSearch.trim() !== "") {
                                  const q = retiringPosSearch.toLowerCase();
                                  const match = pos.positionName.toLowerCase().includes(q) || pos.currentIncumbent.toLowerCase().includes(q) || pos.division.toLowerCase().includes(q);
                                  if (!match) return false;
                                }
                                if (retiringPosUrgencyFilter !== "All" && pos.urgency !== retiringPosUrgencyFilter) return false;
                                if (retiringPosStatusFilter === "Assigned" && !pos.assignedSuccessorId) return false;
                                if (retiringPosStatusFilter === "Unassigned" && pos.assignedSuccessorId) return false;
                                return true;
                              })
                              .map((pos) => {
                              const assignedTalent = talents.find((t) => t.id === pos.assignedSuccessorId);
                              const isSelected = selectedRetiringPositionId === pos.id;
                              
                              // Calculate match score if assigned
                              const matchScore = assignedTalent ? calculateMatchScore(assignedTalent, pos) : null;

                              return (
                                <div
                                  key={pos.id}
                                  onClick={() => setSelectedRetiringPositionId(pos.id)}
                                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative ${
                                    isSelected
                                      ? "border-primary bg-primary-container/5 ring-1 ring-primary shadow-sm"
                                      : "border-surface-container-highest bg-white hover:border-outline-variant hover:shadow-xs"
                                  }`}
                                >
                                  {/* Urgency and timeline */}
                                  <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      pos.urgency === "High"
                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                        : pos.urgency === "Medium"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-surface-container-highest text-on-surface-variant border border-surface-container-high"
                                    }`}>
                                      {pos.urgency} Urgency
                                    </span>
                                    {pos.urgency === "High" && (() => {
                                      const successor = pos.assignedSuccessorId ? talents.find(t => t.id === pos.assignedSuccessorId) : null;
                                      const isReadyNow = successor?.readiness.toUpperCase() === "READY NOW";
                                      if (!isReadyNow) {
                                        return (
                                          <span className="inline-flex items-center gap-0.5 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse ml-1.5">
                                            <span>⚠️ No Ready Successor</span>
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                    <span className="text-[10px] text-on-surface-variant font-bold flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-primary-container" />
                                      {pos.retirementDate}
                                    </span>
                                  </div>

                                  <h4 className="font-display font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors">
                                    {pos.positionName}
                                  </h4>
                                  
                                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-on-surface-variant">
                                    <span className="font-semibold text-on-surface">Petahana: {pos.currentIncumbent}</span>
                                    <span className="text-outline-variant">•</span>
                                    <span>{pos.division}</span>
                                  </div>

                                  {/* Designated Successor Display */}
                                  <div className="mt-4 pt-3 border-t border-dashed border-surface-container-highest">
                                    {assignedTalent ? (
                                      <div className="flex items-center justify-between bg-surface p-2 rounded-lg border border-surface-container-highest">
                                        <div className="flex items-center gap-2">
                                          <img
                                            src={assignedTalent.avatar}
                                            className="w-8 h-8 rounded-full object-cover border border-white"
                                            alt={assignedTalent.name}
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="text-left">
                                            <span className="text-xs font-bold text-on-surface block leading-tight">
                                              {assignedTalent.name}
                                            </span>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase block mt-0.5 w-max ${
                                              pos.suitabilityStatus === "Primary"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : pos.suitabilityStatus === "Secondary"
                                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                : "bg-amber-50 text-amber-700 border border-amber-200"
                                            }`}>
                                              {pos.suitabilityStatus || "Primary"} Successor
                                            </span>
                                          </div>
                                        </div>
                                        {matchScore !== null && (
                                          <div className="text-right">
                                            <span className="text-xs font-black text-emerald-600 block">
                                              {matchScore}%
                                            </span>
                                            <span className="text-[8px] text-on-surface-variant uppercase tracking-wider block font-medium">
                                              Match Rate
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="p-2 bg-rose-50/50 rounded-lg border border-rose-100 text-center">
                                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                                          ⚠️ BELUM ADA CALON PENERUS
                                        </span>
                                        <span className="text-[8px] text-rose-600 block mt-0.5">
                                          Pilih posisi ini lalu cari suksesor potensial dari database.
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }))}
                          </div>
                        </div>

                        {/* Right column: Dynamic Matcher & Calibrator (3/5) */}
                        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-surface-container-highest shadow-sm min-h-[450px] flex flex-col">
                          {!selectedRetiringPositionId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Award className="w-8 h-8 text-primary" />
                              </div>
                              <div className="max-w-md space-y-1">
                                <h3 className="font-display font-bold text-sm text-on-surface uppercase tracking-wide">
                                  Pilih Posisi untuk Memulai Pencocokan Suksesor
                                </h3>
                                <p className="text-xs text-on-surface-variant">
                                  Klik salah satu jabatan Top Management di panel kiri untuk membuka sistem integrasi pencocokan otomatis. AI Match Engine kami akan mengalkulasi kecocokan kompetensi dan merekomendasikan penerus terbaik yang siap memimpin.
                                </p>
                              </div>
                            </div>
                          ) : (() => {
                            const selectedPos = retiringPositions.find(p => p.id === selectedRetiringPositionId);
                            if (!selectedPos) return null;

                            // Calculate match scores for all talents & sort
                            const recommendedTalents = talents
                              .map(t => ({
                                talent: t,
                                score: calculateMatchScore(t, selectedPos)
                              }))
                              .sort((a, b) => b.score - a.score);

                            return (
                              <div className="space-y-6 text-left flex-1 flex flex-col">
                                {/* Selected Position info card */}
                                <div className="p-4 bg-surface rounded-xl border border-surface-container-highest relative">
                                  {userRole === "admin" && (
                                    <button
                                      onClick={() => {
                                        triggerDeleteModal({
                                          title: "Hapus Pelacakan Posisi Suksesi?",
                                          itemName: selectedPos.positionName,
                                          itemSubtitle: `Petahana: ${selectedPos.currentIncumbent || '-'} • Target Pensiun: ${selectedPos.retirementDate || '-'}`,
                                          itemBadge: `Divisi: ${selectedPos.division || '-'}`,
                                          warningText: "Apakah Anda yakin ingin menghapus posisi suksesi pensiun ini dari dashboard pelacakan?",
                                          confirmButtonText: "Ya, Hapus Posisi",
                                          onConfirm: () => {
                                            setRetiringPositions(prev => prev.filter(p => p.id !== selectedPos.id));
                                            setSelectedRetiringPositionId(null);
                                            setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
                                          }
                                        });
                                      }}
                                      className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus Posisi Pensiun"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}

                                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-primary uppercase tracking-wider mb-1">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    Masa Transisi & Suksesi Jabatan
                                  </div>
                                  <h3 className="font-display font-black text-base text-on-surface">
                                    {selectedPos.positionName}
                                  </h3>
                                  
                                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-surface-container-highest">
                                    <div>
                                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">
                                        Petahana Sekarang
                                      </span>
                                      <span className="text-on-surface font-semibold block">{selectedPos.currentIncumbent}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">
                                        Rencana Pensiun
                                      </span>
                                      <span className="text-primary font-bold block">{selectedPos.retirementDate}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">
                                        Kebutuhan Departemen
                                      </span>
                                      <span className="text-on-surface font-medium block">{selectedPos.division}</span>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-3 border-t border-surface-container-highest">
                                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold mb-1.5">
                                      Kompetensi Utama yang Diperlukan (Target Calibration)
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {selectedPos.targetCompetencies.map((comp, idx) => (
                                        <span key={idx} className="bg-primary/5 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/20">
                                          {comp}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* List of recommended successor candidates */}
                                <div className="space-y-3 flex-1 flex flex-col">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <h4 className="font-display font-black text-xs text-on-surface uppercase tracking-wider">
                                      Rekomendasi Suksesor Berdasarkan Kecocokan Data (Talent Alignment)
                                    </h4>
                                    <span className="text-[10px] text-on-surface-variant font-bold">
                                      Diurutkan Berdasarkan Skor Pencocokan
                                    </span>
                                  </div>

                                  {/* Candidate Matcher Filters */}
                                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                                    <div className="relative flex-1 min-w-[120px]">
                                      <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                      <input
                                        type="text"
                                        placeholder="Cari Suksesor..."
                                        value={candidateSearch}
                                        onChange={(e) => setCandidateSearch(e.target.value)}
                                        className="w-full pl-7 pr-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-primary text-on-surface"
                                      />
                                    </div>
                                    <select
                                      value={candidateReadinessFilter}
                                      onChange={(e) => setCandidateReadinessFilter(e.target.value)}
                                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                                    >
                                      <option value="All">Semua Kesiapan</option>
                                      <option value="Ready Now">Ready Now</option>
                                      <option value="1-2 Years">1-2 Years</option>
                                      <option value="3-5 Years">3-5 Years</option>
                                    </select>
                                    <select
                                      value={candidateMatchFilter}
                                      onChange={(e) => setCandidateMatchFilter(e.target.value)}
                                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                                    >
                                      <option value="All">Semua Match %</option>
                                      <option value="High">Tinggi (≥80%)</option>
                                      <option value="Medium">Sedang (50-79%)</option>
                                      <option value="Low">Rendah (&lt;50%)</option>
                                    </select>
                                  </div>

                                  {/* Compact Scroll Container */}
                                  <div className="space-y-2.5 overflow-y-auto max-h-[300px] custom-scrollbar pr-1 flex-1">
                                    {recommendedTalents
                                      .filter(({ talent, score }) => {
                                        if (candidateSearch.trim() !== "") {
                                          const q = candidateSearch.toLowerCase();
                                          const match = talent.name.toLowerCase().includes(q) || talent.title.toLowerCase().includes(q) || talent.division.toLowerCase().includes(q);
                                          if (!match) return false;
                                        }
                                        if (candidateReadinessFilter !== "All" && talent.readiness.toLowerCase() !== candidateReadinessFilter.toLowerCase()) {
                                          return false;
                                        }
                                        if (candidateMatchFilter === "High" && score < 80) return false;
                                        if (candidateMatchFilter === "Medium" && (score < 50 || score >= 80)) return false;
                                        if (candidateMatchFilter === "Low" && score >= 50) return false;
                                        return true;
                                      })
                                      .length === 0 ? (
                                      <div className="p-6 text-center text-slate-400 italic text-xs">
                                        Tidak ada kandidat suksesor yang sesuai dengan kriteria filter.
                                      </div>
                                    ) : (
                                      recommendedTalents
                                      .filter(({ talent, score }) => {
                                        if (candidateSearch.trim() !== "") {
                                          const q = candidateSearch.toLowerCase();
                                          const match = talent.name.toLowerCase().includes(q) || talent.title.toLowerCase().includes(q) || talent.division.toLowerCase().includes(q);
                                          if (!match) return false;
                                        }
                                        if (candidateReadinessFilter !== "All" && talent.readiness.toLowerCase() !== candidateReadinessFilter.toLowerCase()) {
                                          return false;
                                        }
                                        if (candidateMatchFilter === "High" && score < 80) return false;
                                        if (candidateMatchFilter === "Medium" && (score < 50 || score >= 80)) return false;
                                        if (candidateMatchFilter === "Low" && score >= 50) return false;
                                        return true;
                                      })
                                      .map(({ talent, score }) => {
                                      const isNominated = selectedPos.assignedSuccessorId === talent.id;
                                      
                                      // Determine score color
                                      const scoreColor = score >= 80 
                                        ? "text-emerald-600 bg-emerald-50 border-emerald-200" 
                                        : score >= 50 
                                        ? "text-amber-600 bg-amber-50 border-amber-200" 
                                        : "text-rose-600 bg-rose-50 border-rose-200";

                                      const barColor = score >= 80 
                                        ? "bg-emerald-500" 
                                        : score >= 50 
                                        ? "bg-amber-500" 
                                        : "bg-rose-500";

                                      return (
                                        <div 
                                          key={talent.id}
                                          className={`p-3.5 rounded-xl border transition-all ${
                                            isNominated 
                                              ? "border-emerald-600 bg-emerald-50/10 shadow-xs" 
                                              : "border-surface-container-highest hover:bg-surface-container-lowest"
                                          }`}
                                        >
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                                            {/* Candidate basic details */}
                                            <div className="flex items-center gap-3">
                                              <img 
                                                src={talent.avatar} 
                                                className="w-10 h-10 rounded-full object-cover border border-surface shadow-xs" 
                                                alt={talent.name} 
                                                referrerPolicy="no-referrer"
                                                onClick={() => {
                                                  setSelectedTalentId(talent.id);
                                                  setActiveTab("profile");
                                                }}
                                              />
                                              <div className="text-left cursor-pointer" onClick={() => {
                                                setSelectedTalentId(talent.id);
                                                setActiveTab("profile");
                                              }}>
                                                <span className="text-xs font-bold text-on-surface hover:text-primary transition-colors block">
                                                  {talent.name}
                                                </span>
                                                <span className="text-[10px] text-on-surface-variant block">
                                                  {talent.title} • <span className="font-semibold">{talent.division}</span>
                                                </span>
                                              </div>
                                            </div>

                                            {/* Compatibility Score Display */}
                                            <div className="flex items-center gap-2">
                                              <div className="text-right">
                                                <div className="flex items-center gap-1.5">
                                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreColor}`}>
                                                    {score}% Match
                                                  </span>
                                                </div>
                                              </div>
                                              
                                              {/* Readiness Badge */}
                                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                                talent.readinessColor === "emerald"
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                  : talent.readinessColor === "amber"
                                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                                  : "bg-rose-50 text-rose-700 border-rose-200"
                                              }`}>
                                                {talent.readiness}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Match score bar and details breakdown */}
                                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                            <div className="sm:col-span-5">
                                              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                                                <div className={`h-full ${barColor}`} style={{ width: `${score}%` }}></div>
                                              </div>
                                              {/* Mini math breakdown */}
                                              <div className="flex justify-between text-[8px] text-on-surface-variant font-medium mt-1">
                                                <span>Divisi: {talent.division.toLowerCase().includes(selectedPos.division.toLowerCase()) ? "Sesuai (+30)" : "Sektor Lain (+10)"}</span>
                                                <span>Kesiapan: {talent.readiness === "READY NOW" ? "+30" : talent.readiness === "READY 1-2 YEARS" ? "+20" : "+10"}</span>
                                              </div>
                                            </div>

                                            {/* Nominasi actions - ADMIN ONLY */}
                                            <div className="sm:col-span-7 flex justify-end gap-1.5">
                                              {userRole === "admin" ? (
                                                isNominated ? (
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1 mr-1">
                                                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                      Suksesor Ditunjuk ({selectedPos.suitabilityStatus || "Primary"})
                                                    </span>
                                                    <button
                                                      onClick={() => {
                                                        setRetiringPositions(prev =>
                                                          prev.map(p => p.id === selectedPos.id ? { ...p, assignedSuccessorId: undefined, suitabilityStatus: undefined } : p)
                                                        );
                                                      }}
                                                      className="text-[9px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded transition-colors cursor-pointer border border-rose-200"
                                                    >
                                                      Batal Calonkan
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <div className="flex gap-1">
                                                    <button
                                                      onClick={() => {
                                                        setRetiringPositions(prev =>
                                                          prev.map(p => p.id === selectedPos.id ? { ...p, assignedSuccessorId: talent.id, suitabilityStatus: "Primary" } : p)
                                                        );
                                                      }}
                                                      className="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-md shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                                    >
                                                      <UserCheck className="w-3 h-3" />
                                                      Primary
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        setRetiringPositions(prev =>
                                                          prev.map(p => p.id === selectedPos.id ? { ...p, assignedSuccessorId: talent.id, suitabilityStatus: "Secondary" } : p)
                                                        );
                                                      }}
                                                      className="text-[9px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-md shadow-xs transition-all active:scale-95 cursor-pointer"
                                                    >
                                                      Secondary
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        setRetiringPositions(prev =>
                                                          prev.map(p => p.id === selectedPos.id ? { ...p, assignedSuccessorId: talent.id, suitabilityStatus: "Emergency" } : p)
                                                        );
                                                      }}
                                                      className="text-[9px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-md shadow-xs transition-all active:scale-95 cursor-pointer"
                                                    >
                                                      Emergency
                                                    </button>
                                                  </div>
                                                )
                                              ) : (
                                                isNominated && (
                                                  <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1">
                                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                    Suksesor Resmi Ditunjuk ({selectedPos.suitabilityStatus || "Primary"})
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                     }))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 2. TALENT POOL VIEW */}
              {activeTab === "talent-pool" && (
                <motion.div
                  key="talent-pool"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="border-b border-surface-container-highest pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="font-display text-2xl md:text-3xl font-extrabold text-primary">Talent Pool Directory</h1>
                      <p className="text-sm text-on-surface-variant">Perform search, filtering, and detailed evaluations across all high-potential executive successors.</p>
                    </div>
                    {userRole === "admin" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleSyncAllPhotosByGender}
                          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start md:self-center"
                          title="Sinkronkan foto profil seluruh talenta sesuai jenis kelamin (Perempuan & Laki-laki)"
                        >
                          <RefreshCw className="w-4 h-4" />
                          SINKRON FOTO GENDER
                        </button>
                        <button
                          onClick={() => setIsImportOpen(true)}
                          className="bg-secondary hover:bg-secondary/95 text-white font-bold text-xs px-5 py-3 rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start md:self-center"
                        >
                          <Upload className="w-4 h-4" />
                          IMPORT DATA
                        </button>
                        <button
                          onClick={() => setIsAddTalentOpen(true)}
                          className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-5 py-3 rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start md:self-center"
                        >
                          <Plus className="w-4 h-4" />
                          TAMBAH KANDIDAT BARU
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Saved Filters Quick Bar */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-primary" />
                        <span className="font-display font-extrabold text-xs text-primary uppercase tracking-wider">Saved Filters / Quick Views</span>
                        <span className="text-[10px] bg-primary/10 text-primary font-extrabold px-2 py-0.5 rounded-full">
                          {savedFilters.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Reset Filter Button */}
                        {(searchTerm || divisionFilter !== "All" || readinessFilter !== "All") && (
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setDivisionFilter("All");
                              setReadinessFilter("All");
                              setActiveSavedFilterId(null);
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Filter</span>
                          </button>
                        )}

                        {/* Save Current Filter Button */}
                        <button
                          onClick={() => {
                            setNewFilterName(
                              divisionFilter !== "All" && readinessFilter !== "All"
                                ? `${divisionFilter} (${readinessFilter})`
                                : divisionFilter !== "All"
                                ? `Divisi ${divisionFilter}`
                                : readinessFilter !== "All"
                                ? `Filter ${readinessFilter}`
                                : "Filter Kustom " + new Date().toLocaleDateString('id-ID')
                            );
                            setIsSaveFilterModalOpen(true);
                          }}
                          className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>Simpan Filter Ini</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Filters Pill Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                      {savedFilters.map((filter) => {
                        const isActive = activeSavedFilterId === filter.id;
                        const count = getFilterMatchCount(filter);

                        return (
                          <div
                            key={filter.id}
                            onClick={() => handleApplySavedFilter(filter)}
                            className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shrink-0 select-none ${
                              isActive
                                ? "bg-primary text-white border-primary shadow-xs ring-2 ring-primary/30"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-100/80 dark:hover:bg-slate-800"
                            }`}
                            title={filter.description || `Filter: ${filter.name}`}
                          >
                            {isActive ? (
                              <BookmarkCheck className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-primary transition-colors" />
                            )}

                            <span>{filter.name}</span>

                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {count}
                            </span>

                            {!filter.isPreset && (
                              <button
                                onClick={(e) => handleDeleteSavedFilter(filter.id, e)}
                                className={`p-0.5 rounded-full hover:bg-black/20 transition-colors ${
                                  isActive ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-rose-600"
                                }`}
                                title="Hapus Filter Tersimpan Ini"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filters Board */}
                  <div className="bg-white p-5 rounded-xl border border-surface-container-highest shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-outline-variant" />
                      <input 
                        type="text" 
                        placeholder="Search name or title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg border border-surface-container-highest text-sm focus:outline-none focus:border-primary text-on-surface placeholder:text-outline"
                      />
                    </div>

                    <div>
                      <select 
                        value={divisionFilter}
                        onChange={(e) => setDivisionFilter(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-surface rounded-lg border border-surface-container-highest text-sm focus:outline-none focus:border-primary text-on-surface"
                      >
                        <option value="All">All Departments</option>
                        {divisions.filter(d => d !== "All").map((div) => (
                          <option key={div} value={div}>{div}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select 
                        value={readinessFilter}
                        onChange={(e) => setReadinessFilter(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-surface rounded-lg border border-surface-container-highest text-sm focus:outline-none focus:border-primary text-on-surface"
                      >
                        <option value="All">All Readiness Levels</option>
                        {readinessOptions.filter(r => r !== "All").map((ready) => (
                          <option key={ready} value={ready}>{ready}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Directory Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTalents.length > 0 ? (
                      paginatedTalents.map((t) => (
                        <div 
                          key={t.id}
                          className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                            selectedTalentId === t.id ? "ring-2 ring-primary border-transparent" : "border-surface-container-highest"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex gap-4">
                                <img src={t.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-surface shadow-sm" alt={t.name} referrerPolicy="no-referrer" />
                                <div>
                                  <h3 className="font-display font-bold text-base text-on-surface">{t.name}</h3>
                                  <p className="text-xs text-secondary font-medium">{t.title}</p>
                                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-outline" />
                                    <span>{t.location}</span>
                                  </div>
                                </div>
                              </div>
                              {userRole === "admin" ? (
                                <select
                                  value={t.readiness}
                                  onChange={(e) => handleUpdateReadiness(t.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${
                                    t.readinessColor === "emerald" 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : t.readinessColor === "amber"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  <option value="READY NOW">READY NOW</option>
                                  <option value="READY 1-2 YEARS">READY 1-2 YEARS</option>
                                  <option value="READY 2+ YEARS">READY 2+ YEARS</option>
                                </select>
                              ) : (
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                  t.readinessColor === "emerald" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : t.readinessColor === "amber"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}>
                                  {t.readiness}
                                </span>
                              )}
                            </div>

                            {/* Core metrics overview inside card */}
                            <div className="grid grid-cols-3 gap-2 bg-surface p-3 rounded-lg border border-surface-container-highest mb-4 text-center">
                              <div>
                                <span className="text-[10px] text-on-surface-variant font-semibold block">Logical</span>
                                <span className="text-sm font-bold text-primary">{t.psychometric.logicalReasoning.score}%</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-on-surface-variant font-semibold block">Leadership</span>
                                <span className="text-sm font-bold text-secondary">{t.psychometric.leadershipPotential.score}%</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-on-surface-variant font-semibold block">Tenure</span>
                                <span className="text-sm font-bold text-on-surface">{t.tenure}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => {
                                setSelectedTalentId(t.id);
                                setActiveTab("profile");
                              }}
                              className="flex-1 bg-primary-container/10 hover:bg-primary-container/20 text-primary text-xs font-bold py-2.5 rounded-lg transition-colors text-center cursor-pointer"
                            >
                              VIEW DETAILED PROFILE
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedTalentId(t.id);
                                setIsReportModalOpen(true);
                              }}
                              className="bg-white border border-surface-container-highest hover:bg-surface text-secondary p-2.5 rounded-lg transition-colors cursor-pointer"
                              title="Download Advisory PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {userRole === "admin" && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTalent(t.id, t.name);
                                }}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 p-2.5 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Talenta"
                              >
                                <Trash2 className="w-4 h-4 text-rose-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-surface-container-highest">
                        <AlertCircle className="w-12 h-12 text-outline-variant mx-auto mb-3" />
                        <h3 className="font-display font-bold text-base text-on-surface">No Talents Found</h3>
                        <p className="text-xs text-on-surface-variant mt-1">Refine your search term or filtration selections to find candidates.</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {filteredTalents.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-surface-container-highest shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-on-surface-variant">
                        Menampilkan <span className="font-bold text-on-surface">{Math.min(startIndex + 1, filteredTalents.length)}</span> - <span className="font-bold text-on-surface">{Math.min(endIndex, filteredTalents.length)}</span> dari <span className="font-bold text-on-surface">{filteredTalents.length}</span> talenta
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-on-surface-variant">Baris per halaman:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="px-2 py-1 bg-surface border border-surface-container-highest rounded text-xs focus:outline-none text-on-surface"
                          >
                            <option value={6}>6 per hal</option>
                            <option value={12}>12 per hal</option>
                            <option value={24}>24 per hal</option>
                            <option value={50}>50 per hal</option>
                            <option value={100}>100 per hal</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-surface-container-highest rounded-lg bg-surface hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Halaman Sebelumnya"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          
                          {getPaginationRange(currentPage, totalPages).map((item, index) => {
                            if (typeof item === "number") {
                              return (
                                <button
                                  key={index}
                                  onClick={() => setCurrentPage(item)}
                                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    currentPage === item
                                      ? "bg-primary text-white"
                                      : "border border-surface-container-highest bg-surface hover:bg-surface-container-high text-on-surface"
                                  }`}
                                >
                                  {item}
                                </button>
                              );
                            }
                            return <span key={index} className="text-xs text-on-surface-variant px-1 select-none">...</span>;
                          })}

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-surface-container-highest rounded-lg bg-surface hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Halaman Berikutnya"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 3. DETAILED PROFILE VIEW (Matching the user screenshot exactly) */}
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Read-Only Karyawan Mode Alert Banner */}
                  {userRole === "user" && (
                    <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl flex items-start gap-4 shadow-sm">
                      <div className="p-3 bg-emerald-100 rounded-lg text-emerald-800 flex-shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-sm text-emerald-900">Mode Mandiri Karyawan Terverifikasi (Read-Only)</h4>
                        <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                          Selamat datang, <strong>{currentTalent.name}</strong>. Anda sedang mengakses portal Succession Board mandiri Anda. Skor penilaian kompetensi, hasil psikometrik, dan rencana pengembangan IDP di bawah ini telah dikalibrasi dan disahkan oleh Komite HR Regional. Jika Anda memiliki saran pengembangan atau ingin memperbarui preferensi pelatihan Anda, silakan isi formulir aspirasi karir di bagian bawah halaman ini.
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Profile Header Card */}
                  <section className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-highest p-6 relative overflow-hidden">
                    {/* Background subtle blur mesh */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
                      
                      {/* Avatar */}
                      <div className="relative group w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-md flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                        <img 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          src={currentTalent.avatar}
                          alt={currentTalent.name}
                          referrerPolicy="no-referrer"
                        />
                        <label 
                          htmlFor={`header-avatar-upload-${currentTalent.id}`}
                          className="absolute inset-0 bg-slate-900/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-extrabold cursor-pointer p-2 text-center"
                          title="Klik untuk Upload Foto dari Komputer"
                        >
                          <Camera className="w-6 h-6 mb-1 text-teal-300 animate-bounce" />
                          <span>GANTI FOTO</span>
                        </label>
                        <input 
                          type="file" 
                          id={`header-avatar-upload-${currentTalent.id}`} 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64Url = await compressImageFile(file, 256, 0.75);
                                if (base64Url) {
                                  setTalents(prev => prev.map(t => t.id === currentTalent.id ? { ...t, avatar: base64Url } : t));
                                  setAdminProfileSuccessMsg(`Foto profil ${currentTalent.name} berhasil diperbarui!`);
                                  setTimeout(() => setAdminProfileSuccessMsg(""), 4000);
                                }
                              } catch (err: any) {
                                alert("Gagal memproses foto: " + (err.message || "Unknown error"));
                              }
                            }
                          }}
                        />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">{currentTalent.name}</h1>
                          
                          {/* Talent Quick Switcher dropdown */}
                          <div className="flex items-center gap-1.5 bg-surface-container-low border border-surface-container-highest rounded-lg px-2.5 py-1 text-xs self-start sm:self-auto">
                            <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-[10px] font-bold uppercase text-on-surface-variant shrink-0">Switch Talent:</span>
                            <select
                              value={selectedTalentId}
                              onChange={(e) => setSelectedTalentId(e.target.value)}
                              className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer max-w-[220px] truncate"
                              title="Pilih Profil Kandidat Lain"
                            >
                              {talents.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({t.division})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            {currentTalent.gender === "Perempuan" ? "👩 Perempuan" : "👨 Laki-laki"}
                          </span>

                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border tracking-wide uppercase ${
                            currentTalent.readinessColor === "emerald" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : currentTalent.readinessColor === "amber"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {currentTalent.readiness}
                          </span>
                        </div>
                        
                        <p className="font-sans text-base text-secondary font-medium">{currentTalent.title}</p>
                        
                        {!isEditingScores ? (
                          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 mt-3 border-t border-surface-container-highest">
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <MapPin className="w-4 h-4 text-outline" />
                              <span className="text-xs font-medium">{currentTalent.location}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <Building2 className="w-4 h-4 text-outline" />
                              <span className="text-xs font-medium">{currentTalent.division}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <History className="w-4 h-4 text-outline" />
                              <span className="text-xs font-medium">Tenure: {currentTalent.tenure}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-surface-container-highest">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Lokasi Kerja</label>
                              <input 
                                type="text"
                                value={currentTalent.location}
                                onChange={(e) => setTalents(prev => prev.map(t => t.id === currentTalent.id ? { ...t, location: e.target.value } : t))}
                                className="w-full px-2 py-1 bg-surface rounded-lg border border-surface-container-highest text-xs focus:outline-none focus:border-primary text-on-surface"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Masa Kerja (Tenure)</label>
                              <input 
                                type="text"
                                value={currentTalent.tenure}
                                onChange={(e) => setTalents(prev => prev.map(t => t.id === currentTalent.id ? { ...t, tenure: e.target.value } : t))}
                                className="w-full px-2 py-1 bg-surface rounded-lg border border-surface-container-highest text-xs focus:outline-none focus:border-primary text-on-surface"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Divisi / Department</label>
                              <input 
                                type="text"
                                value={currentTalent.division}
                                onChange={(e) => setTalents(prev => prev.map(t => t.id === currentTalent.id ? { ...t, division: e.target.value } : t))}
                                className="w-full px-2 py-1 bg-surface rounded-lg border border-surface-container-highest text-xs focus:outline-none focus:border-primary text-on-surface"
                              />
                            </div>
                          </div>
                        )}

                        {/* Additional Profiling Fields */}
                        {!isEditingScores ? (
                          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2.5 mt-2.5 border-t border-dashed border-surface-container-highest">
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <UserCheck className="w-4 h-4 text-primary" />
                              <span className="text-xs font-medium">
                                NIK: <span className="font-bold text-on-surface">{currentTalent.nik || "-"}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <Award className="w-4 h-4 text-primary" />
                              <span className="text-xs font-medium">
                                Grade: <span className="font-extrabold text-primary">{currentTalent.grade || "M4"}</span>
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <Calendar className="w-4 h-4 text-outline" />
                              <span className="text-xs font-medium">
                                Lahir: <span className="font-bold">{currentTalent.birthDate || "-"}</span> ({currentTalent.age || "-"} thn)
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <Calendar className="w-4 h-4 text-outline" />
                              <span className="text-xs font-medium">
                                Masuk: <span className="font-bold">{currentTalent.joinDate || "-"}</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 mt-2.5 border-t border-dashed border-surface-container-highest">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">NIK Karyawan</label>
                              <input 
                                type="text"
                                value={currentTalent.nik || ""}
                                onChange={(e) => setTalents(prev => prev.map(t => t.id === currentTalent.id ? { ...t, nik: e.target.value } : t))}
                                className="w-full px-2 py-1 bg-surface rounded-lg border border-surface-container-highest text-xs focus:outline-none focus:border-primary text-on-surface"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Grade</label>
                              <select 
                                value={currentTalent.grade || "M4"}
                                onChange={(e) => setTalents(prev => prev.map(t => t.id === currentTalent.id ? { ...t, grade: e.target.value } : t))}
                                className="w-full px-2 py-1 bg-surface rounded-lg border border-surface-container-highest text-xs focus:outline-none focus:border-primary text-on-surface"
                              >
                                <option value="M5">M5 (SVP / Director)</option>
                                <option value="M4">M4 (VP / Senior Director)</option>
                                <option value="M3">M3 (AVP / Director)</option>
                                <option value="M2">M2 (Senior Manager)</option>
                                <option value="M1">M1 (Manager)</option>
                                <option value="ST5">ST5 (Principal / Senior Advisor)</option>
                                <option value="ST4">ST4 (Lead / Advisor)</option>
                                <option value="ST3">ST3 (Senior Staff)</option>
                                <option value="ST2">ST2 (Staff)</option>
                                <option value="ST1">ST1 (Junior Staff)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Tanggal Lahir</label>
                              <input 
                                type="date"
                                value={currentTalent.birthDate || "1988-10-10"}
                                onChange={(e) => {
                                  const dateVal = e.target.value;
                                  let calculatedAge = currentTalent.age || 38;
                                  if (dateVal) {
                                    const birthYear = new Date(dateVal).getFullYear();
                                    const currentYear = new Date().getFullYear();
                                    if (!isNaN(birthYear)) {
                                      calculatedAge = currentYear - birthYear;
                                    }
                                  }
                                  setTalents(prev => prev.map(t => t.id === currentTalent.id ? { ...t, birthDate: dateVal, age: calculatedAge } : t));
                                }}
                                className="w-full px-2 py-1 bg-surface rounded-lg border border-surface-container-highest text-xs focus:outline-none focus:border-primary text-on-surface"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Tanggal Masuk</label>
                              <input 
                                type="date"
                                value={currentTalent.joinDate || "2021-01-01"}
                                onChange={(e) => setTalents(prev => prev.map(t => t.id === currentTalent.id ? { ...t, joinDate: e.target.value } : t))}
                                className="w-full px-2 py-1 bg-surface rounded-lg border border-surface-container-highest text-xs focus:outline-none focus:border-primary text-on-surface"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Mobile Action */}
                      <button 
                        onClick={() => setIsReportModalOpen(true)}
                        className="md:hidden w-full mt-4 bg-primary text-white font-bold text-xs py-3.5 rounded-lg shadow-sm hover:bg-primary/95 transition-colors flex justify-center items-center gap-2 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        DOWNLOAD REPORT
                      </button>

                    </div>
                  </section>

                  {/* Profile sub-tabs selector */}
                  <div className="bg-white rounded-xl border border-surface-container-highest p-1.5 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex gap-2">
                    <button
                      onClick={() => setProfileSubTab("profile-competencies")}
                      className={`flex-1 py-3 px-4 rounded-lg font-display font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        profileSubTab === "profile-competencies"
                          ? "bg-primary text-white shadow-xs"
                          : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Profil & Kompetensi
                    </button>
                    <button
                      onClick={() => setProfileSubTab("idp-training")}
                      className={`flex-1 py-3 px-4 rounded-lg font-display font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        profileSubTab === "idp-training"
                          ? "bg-primary text-white shadow-xs"
                          : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      Rencana IDP & Pelatihan
                    </button>
                  </div>

                  {profileSubTab === "profile-competencies" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      {/* Nine-Box Matrix Placement Banner */}
                  {(() => {
                    const placement = getTalentPlacement(currentTalent);
                    const evalScores = evaluationYears.map(yr => currentTalent.performanceEvaluation?.[`fy${yr}`] ?? 3);
                    let avgEval = evalScores.length > 0 ? evalScores.reduce((a, b) => a + b, 0) / evalScores.length : 3;
                    if (currentTalent.customPerformance) {
                      if (currentTalent.customPerformance === "Low") avgEval = 1.75;
                      else if (currentTalent.customPerformance === "Medium") avgEval = 3.25;
                      else if (currentTalent.customPerformance === "High") avgEval = 4.5;
                    }
                    const details = calculateTalentPotentialDetails(currentTalent);

                    const getNineBoxCellInfo = (perf: "Low" | "Medium" | "High", pot: "Low" | "Medium" | "High") => {
                      if (pot === "High") {
                        if (perf === "Low") return { name: "Enigma (Dilemma)", bg: "bg-amber-50 text-amber-900 border-amber-200", zone: "Zona Biru (Talenta Inti / Pengembangan)", zoneColor: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800", desc: "Potensi kepemimpinan tinggi namun kinerja saat ini belum optimal. Membutuhkan bimbingan kinerja tambahan." };
                        if (perf === "Medium") return { name: "High Potential", bg: "bg-sky-50 text-sky-900 border-sky-200", zone: "Zona Biru (Talenta Inti / Pengembangan)", zoneColor: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800", desc: "Kandidat kuat dengan potensi kepemimpinan tinggi dan kinerja stabil untuk dikembangkan ke depan." };
                        return { name: "Star Leader (Future Star)", bg: "bg-emerald-50 text-emerald-900 border-emerald-200 ring-2 ring-emerald-500/20", zone: "Zona Hijau (Star / Promosi)", zoneColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800", desc: "Talenta terbaik dengan potensi dan kinerja maksimal. Prioritas utama untuk suksesi kepemimpinan." };
                      }
                      if (pot === "Medium") {
                        if (perf === "Low") return { name: "Inconsistent Performer", bg: "bg-amber-50 text-amber-900 border-amber-200", zone: "Zona Merah (Risiko / PIP)", zoneColor: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800", desc: "Kinerja kurang konsisten meskipun memiliki kapasitas potensi yang memadai. Butuh mentoring berkala." };
                        if (perf === "Medium") return { name: "Core Contributor", bg: "bg-slate-50 text-slate-900 border-slate-200", zone: "Zona Biru (Talenta Inti / Pengembangan)", zoneColor: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800", desc: "Kontributor inti yang andal dengan kinerja stabil dan potensi seimbang bagi pertumbuhan organisasi." };
                        return { name: "High Performer", bg: "bg-indigo-50 text-indigo-900 border-indigo-200", zone: "Zona Hijau (Star / Promosi)", zoneColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800", desc: "Kinerja sangat tinggi dengan potensi kepemimpinan menengah yang dapat dioptimalkan." };
                      }
                      // Low Potential
                      if (perf === "Low") return { name: "Underperformer (Risk)", bg: "bg-rose-50 text-rose-900 border-rose-200", zone: "Zona Merah (Risiko / PIP)", zoneColor: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800", desc: "Kinerja dan potensi rendah saat ini. Memerlukan bimbingan intensif atau Performance Improvement Plan (PIP)." };
                      if (perf === "Medium") return { name: "Solid Performer", bg: "bg-gray-50 text-gray-900 border-gray-200", zone: "Zona Merah (Risiko / PIP)", zoneColor: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800", desc: "Kinerja baik dan stabil, namun potensi pengembangan kepemimpinan masih terbatas." };
                      return { name: "Workhorse / Specialist", bg: "bg-slate-50 text-slate-900 border-slate-200", zone: "Zona Biru (Talenta Inti / Pengembangan)", zoneColor: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800", desc: "Pakar spesialis dengan kinerja unggul luar biasa namun minat/potensi kepemimpinan struktural terbatas." };
                    };

                    const cellInfo = getNineBoxCellInfo(placement.performance, placement.potential);

                    const getBoxNum = (perf: "Low" | "Medium" | "High", pot: "Low" | "Medium" | "High") => {
                      if (pot === "High") return perf === "Low" ? 7 : perf === "Medium" ? 8 : 9;
                      if (pot === "Medium") return perf === "Low" ? 4 : perf === "Medium" ? 5 : 6;
                      return perf === "Low" ? 1 : perf === "Medium" ? 2 : 3;
                    };

                    const currentBoxNum = getBoxNum(placement.performance, placement.potential);

                    const getActionRecommendation = (perf: "Low" | "Medium" | "High", pot: "Low" | "Medium" | "High") => {
                      if (pot === "High") {
                        if (perf === "Low") return "Bimbingan kinerja intensif untuk mengeksplorasi hambatan kerja dan mengoptimalkan potensi kepemimpinan tinggi.";
                        if (perf === "Medium") return "Berikan tanggung jawab proyek lintas divisi dan mentoring kepemimpinan tingkat lanjut untuk persiapan promosi.";
                        return "Kandidat prioritas utama untuk suksesi kepemimpinan langsung (Ready Now). Berikan program pelatihan eksekutif.";
                      }
                      if (pot === "Medium") {
                        if (perf === "Low") return "Berikan bimbingan teknis berkala serta evaluasi motivasi kerja atau tantangan personal yang menghambat performa.";
                        if (perf === "Medium") return "Fokus pada penguatan kompetensi manajerial menengah dan pertahankan tingkat keterlibatan kerja tetap stabil.";
                        return "Pertahankan kinerja tinggi melalui penghargaan kompetitif dan pertimbangkan keterlibatan dalam keputusan strategis.";
                      }
                      if (perf === "Low") return "Evaluasi peran pekerjaan secara menyeluruh dan terapkan Performance Improvement Plan (PIP) terstruktur.";
                      if (perf === "Medium") return "Penguatan keahlian teknis operasional dan penyesuaian ekspektasi pengembangan karier sesuai kapasitas.";
                      return "Optimalkan peran sebagai pakar spesialis fungsional (Workhorse) serta berikan pengakuan atas pencapaian kinerjanya.";
                    };

                    return (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm text-left space-y-5">
                        {/* Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 text-primary dark:text-teal-400 rounded-xl shrink-0">
                              <Grid3X3 className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                  POSISI MATRIKS SEMBILAN KOTAK (NINE-BOX)
                                </span>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${cellInfo.zoneColor}`}>
                                  {cellInfo.zone}
                                </span>
                              </div>
                              <h2 className="font-display font-extrabold text-lg sm:text-xl text-primary dark:text-teal-400 flex items-center gap-2 mt-0.5">
                                {cellInfo.name} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">(Box {currentBoxNum})</span>
                              </h2>
                            </div>
                          </div>

                          {currentTalent.customPerformance || currentTalent.customPotential ? (
                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-lg flex items-center gap-1.5 self-start sm:self-center shrink-0">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              Kalibrasi Manual HR
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 self-start sm:self-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Asesmen Otomatis Terverifikasi
                            </span>
                          )}
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                          
                          {/* LEFT COLUMN: Visual Nine Box Tool Canvas (lg:col-span-5) */}
                          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Grid3X3 className="w-3.5 h-3.5 text-primary dark:text-teal-400" />
                                Interactive Nine-Box Tool
                              </span>
                              <span className="text-[9px] font-black text-primary dark:text-teal-300 bg-primary/10 dark:bg-teal-950/80 px-2 py-0.5 rounded border border-primary/20 dark:border-teal-800">
                                Lokasi: Box {currentBoxNum}
                              </span>
                            </div>

                            {/* 3x3 Grid Tool Representation */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[8px] font-extrabold text-slate-500 dark:text-slate-400 uppercase px-1">
                                <span>Sumbu Y: Kinerja</span>
                                <span>Sumbu X: Potensi</span>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 w-full">
                                {[
                                  { box: 4, label: "Enigma", pot: "Low", perf: "High", bg: "bg-amber-50 dark:bg-amber-950/30" },
                                  { box: 7, label: "High Pot.", pot: "Medium", perf: "High", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                                  { box: 9, label: "Star Leader", pot: "High", perf: "High", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
                                  { box: 2, label: "Inconsistent", pot: "Low", perf: "Medium", bg: "bg-rose-50 dark:bg-rose-950/30" },
                                  { box: 5, label: "Core Contrib.", pot: "Medium", perf: "Medium", bg: "bg-sky-50 dark:bg-sky-950/30" },
                                  { box: 8, label: "High Perf.", pot: "High", perf: "Medium", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                                  { box: 1, label: "Underperf.", pot: "Low", perf: "Low", bg: "bg-rose-100 dark:bg-rose-900/40" },
                                  { box: 3, label: "Solid Perf.", pot: "Medium", perf: "Low", bg: "bg-amber-50 dark:bg-amber-950/30" },
                                  { box: 6, label: "Specialist", pot: "High", perf: "Low", bg: "bg-sky-50 dark:bg-sky-950/30" }
                                ].map((cell) => {
                                  const isActive = placement.potential === cell.pot && placement.performance === cell.perf;
                                  return (
                                    <div 
                                      key={cell.box}
                                      className={`rounded-lg p-2 border transition-all flex flex-col justify-between items-center text-center relative h-[78px] ${
                                        isActive 
                                          ? "bg-primary text-white border-primary ring-2 ring-primary ring-offset-1 ring-offset-white dark:ring-offset-slate-900 shadow-md scale-[1.02] z-10" 
                                          : `${cell.bg} border-slate-200/80 dark:border-slate-700/80 opacity-70`
                                      }`}
                                    >
                                      <span className={`text-[8px] font-black block ${isActive ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
                                        Box {cell.box}
                                      </span>

                                      {isActive ? (
                                        <div className="flex flex-col items-center my-auto">
                                          <div className="w-5 h-5 rounded-full bg-white text-primary flex items-center justify-center text-[8px] font-black shadow-xs">
                                            {currentTalent.name[0]}
                                          </div>
                                          <span className="text-[7.5px] font-black text-white mt-0.5 truncate max-w-[62px]">
                                            {currentTalent.name.split(" ")[0]}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[7.5px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[60px] my-auto">
                                          {cell.label}
                                        </span>
                                      )}

                                      {isActive ? (
                                        <span className="text-[6.5px] font-black uppercase bg-white/20 text-white px-1 py-0.2 rounded">
                                          Posisi Talenta
                                        </span>
                                      ) : (
                                        <span className="text-[6.5px] font-medium text-slate-400 dark:text-slate-500 uppercase">
                                          {cell.perf[0]}/{cell.pot[0]}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium text-center bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200/60 dark:border-slate-800">
                              Koordinat Aktif: <strong className="text-slate-800 dark:text-slate-200">Sumbu Y ({placement.performance}) × Sumbu X ({placement.potential})</strong>
                            </div>
                          </div>

                          {/* RIGHT COLUMN: Axis Breakdown & Neat Remarks Layout (lg:col-span-7) */}
                          <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5">
                            
                            {/* 2-Column Axis Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Sumbu Y Card */}
                              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    SUMBU Y : EVALUASI KINERJA (100%)
                                  </span>
                                  <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                                    {avgEval.toFixed(2)} / 5.00
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-2 pt-0.5">
                                  <span className="text-base font-black text-slate-900 dark:text-slate-100">{placement.performance}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                    ({placement.performance === "High" ? "Kinerja Sangat Baik" : placement.performance === "Medium" ? "Kinerja Memadai" : "Kinerja Perlu Ditingkatkan"})
                                  </span>
                                </div>
                              </div>

                              {/* Sumbu X Card */}
                              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    SUMBU X : POTENSI KEPEMIMPINAN
                                  </span>
                                  <span className="text-[9px] font-extrabold text-primary dark:text-teal-300 bg-primary/10 dark:bg-teal-950 px-1.5 py-0.5 rounded border border-primary/20 dark:border-teal-800 font-mono">
                                    {details.totalPotentialScore.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-2 pt-0.5">
                                  <span className="text-base font-black text-slate-900 dark:text-slate-100">{placement.potential}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                    ({placement.potential === "High" ? "Potensi Kepemimpinan Tinggi" : placement.potential === "Medium" ? "Potensi Kepemimpinan Menengah" : "Potensi Terbatas"})
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Structured Remarks Container */}
                            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 flex-1 flex flex-col justify-between">
                              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                <FileText className="w-4 h-4 text-primary dark:text-teal-400 shrink-0" />
                                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                                  Catatan & Rekomendasi Evaluasi (Remarks)
                                </h4>
                              </div>

                              {/* Box Characteristics Remark */}
                              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                                  Karakteristik Kategori ({cellInfo.name}):
                                </span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                  {cellInfo.desc}
                                </p>
                              </div>

                              {/* Action / Succession Recommendation Remark */}
                              <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10 dark:border-primary/20 space-y-0.5">
                                <span className="text-[9px] font-black uppercase text-primary dark:text-teal-300 block tracking-wider">
                                  Rekomendasi Tindak Lanjut & Strategi IDP (Remarks HR):
                                </span>
                                <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                                  {getActionRecommendation(placement.performance, placement.potential)}
                                </p>
                              </div>

                              {/* Custom Calibration Notes Remark if available */}
                              {currentTalent.nineBoxNotes && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800 space-y-0.5">
                                  <span className="text-[9px] font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1 tracking-wider">
                                    <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                                    Catatan Khusus Komite Suksesi / Kalibrasi Manual:
                                  </span>
                                  <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold italic leading-relaxed">
                                    "{currentTalent.nineBoxNotes}"
                                  </p>
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* AJINOMOTO POTENTIAL CALCULATOR PANEL */}
                  {(() => {
                    const details = calculateTalentPotentialDetails(currentTalent);
                    const pAss = details.assessment;
                    const divisorVal = pAss.targetLevel === "SM" ? 2 : 3;

                    return (
                      <section className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-highest p-6 space-y-6 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-highest pb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl animate-none">
                              <Sliders className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-display text-base font-extrabold text-on-surface uppercase tracking-wide">Kalkulator Potensi Kepemimpinan (Sumbu X)</h3>
                              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Sumbu X : Psychological Test (40%), Competency Test (50%), Educational Back Ground (10%)</p>
                            </div>
                          </div>
                          
                          {/* Live Indicator of Total Score */}
                          <div className="flex items-center gap-3 bg-surface p-3 rounded-lg border border-surface-container-highest self-start sm:self-center">
                            <div className="text-right">
                              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">Total Potensi (ab)</span>
                              <span className="text-lg font-black text-primary">{details.totalPotentialScore.toFixed(1)}%</span>
                            </div>
                            <span className={`text-xs font-black px-2.5 py-1.5 rounded border uppercase ${
                              details.totalPotentialScore >= 80 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : details.totalPotentialScore >= 60
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {details.totalPotentialScore >= 80 ? "HIGH" : details.totalPotentialScore >= 60 ? "MEDIUM" : "LOW"}
                            </span>
                          </div>
                        </div>

                        {/* Excel-style formula sheet */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Left 12 Columns: Main Formula Table */}
                          <div className="lg:col-span-12 space-y-6">
                            
                            {/* A. Psychological Test (40%) */}
                            <div className="border border-surface-container-highest rounded-xl overflow-hidden bg-surface/50">
                              <div className="bg-primary/5 px-4 py-3.5 border-b border-surface-container-highest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center">A</span>
                                  <h4 className="font-display font-black text-xs text-primary uppercase tracking-wider">Psychological Test (Bobot 40%)</h4>
                                </div>
                                <div className="text-xs font-bold text-on-surface-variant">
                                  Formula: k = (i / 24) * 40% = <span className="text-primary">{details.psychWeighted.toFixed(1)}%</span>
                                </div>
                              </div>
                              
                              {/* 8 metrics grid */}
                              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                  { label: "Kemampuan Intelektual", code: "a", field: "kemampuanIntelektual" },
                                  { label: "Berpikir Kritis", code: "b", field: "berpikirKritis" },
                                  { label: "Menyelesaikan Masalah", code: "c", field: "menyelesaikanMasalah" },
                                  { label: "Belajar Cepat", code: "d", field: "belajarCepat" },
                                  { label: "Kesadaran Diri", code: "e", field: "kesadaranDiri" },
                                  { label: "Interpersonal", code: "f", field: "interpersonal" },
                                  { label: "Kecerdasan Emosional", code: "g", field: "kecerdasanEmosional" },
                                  { label: "Motivasi & Komitmen", code: "h", field: "motivasiKomitmen" },
                                ].map((item) => {
                                  const val = pAss[item.field as keyof PotentialAssessment] as number;
                                  return (
                                    <div key={item.code} className="bg-white p-3 rounded-lg border border-surface-container-highest space-y-1.5 flex flex-col justify-between shadow-xs text-left">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="text-[10px] text-on-surface-variant font-bold leading-tight">
                                          <span className="font-mono text-primary mr-1 bg-primary/5 px-1 rounded">({item.code})</span>
                                          {item.label}
                                        </div>
                                        <span className={`text-[10px] font-black font-mono px-1.5 py-0.2 rounded-md ${
                                          val === 3 ? "bg-emerald-50 text-emerald-700" : val === 2 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                        }`}>
                                          {val}
                                        </span>
                                      </div>
                                      
                                      <div className="space-y-1.5 pt-1">
                                        {isEditingScores ? (
                                          <select
                                            value={val}
                                            onChange={(e) => handlePotentialMetricChange(item.field as keyof PotentialAssessment, parseInt(e.target.value))}
                                            className="w-full text-xs p-1 rounded border border-surface-container-highest bg-surface focus:outline-none font-bold cursor-pointer"
                                          >
                                            <option value={4}>4 (Sangat Tinggi / Di Atas Standar)</option>
                                            <option value={3}>3 (Tinggi / Sesuai Standar)</option>
                                            <option value={2}>2 (Sedang / Cukup)</option>
                                            <option value={1}>1 (Kurang)</option>
                                          </select>
                                        ) : (
                                          <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                                            <div 
                                              className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                                              style={{ width: `${(val / 4) * 100}%` }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Component summary */}
                              <div className="bg-white border-t border-surface-container-highest px-4 py-3 flex flex-wrap justify-between items-center text-xs font-bold text-on-surface-variant gap-4">
                                <div className="flex items-center gap-4">
                                  <div>Jumlah Poin (i = sum a-h): <span className="text-on-surface font-mono font-black">{details.sumPsych} / 32 (Standar Base: 24)</span></div>
                                  <div>Rasio (j = i / 24): <span className="text-on-surface font-mono font-black">{(details.psychRatio).toFixed(3)}</span></div>
                                </div>
                                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-extrabold uppercase">
                                  Skor Tertimbang (k): {details.psychWeighted.toFixed(1)}%
                                </div>
                              </div>
                            </div>

                            {/* B. Competency (50%) */}
                            <div className="border border-surface-container-highest rounded-xl overflow-hidden bg-surface/50">
                              <div className="bg-secondary/5 px-4 py-3.5 border-b border-surface-container-highest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-secondary text-white text-xs font-black rounded-full flex items-center justify-center">B</span>
                                  <h4 className="font-display font-black text-xs text-secondary uppercase tracking-wider">Detail Competency (Bobot 50%)</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-on-surface-variant">Target Level:</span>
                                  {isEditingScores ? (
                                    <select
                                      value={pAss.targetLevel}
                                      onChange={(e) => handlePotentialMetricChange("targetLevel", e.target.value)}
                                      className="text-xs p-1.5 rounded border border-surface-container-highest bg-white focus:outline-none font-bold cursor-pointer"
                                    >
                                      <option value="SM">SM (Senior Manager, Divisor: 2)</option>
                                      <option value="DM">DM (Department Manager, Divisor: 3)</option>
                                    </select>
                                  ) : (
                                    <span className="bg-secondary text-white text-[10px] font-black px-2.5 py-1 rounded">
                                      {pAss.targetLevel === "SM" ? "SM (Divisor: 2)" : "DM (Divisor: 3)"}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* 9 competencies metrics grid */}
                              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                  { label: "Business Knowledge", code: "l", field: "businessKnowledge" },
                                  { label: "Leadership", code: "m", field: "leadership" },
                                  { label: "Problem Solving", code: "n", field: "problemSolving" },
                                  { label: "Interpersonal Skill", code: "o", field: "interpersonalSkill" },
                                  { label: "Strategic Mindset", code: "p", field: "strategicMindset" },
                                  { label: "Manages Complexity", code: "q", field: "managesComplexity" },
                                  { label: "Ensures Accountability", code: "r", field: "ensuresAccountability" },
                                  { label: "Drives Vision", code: "s", field: "drivesVision" },
                                  { label: "Cultivate Innovation", code: "t", field: "cultivateInnovation" },
                                ].map((item) => {
                                  const val = pAss[item.field as keyof PotentialAssessment] as number;
                                  return (
                                    <div key={item.code} className="bg-white p-3 rounded-lg border border-surface-container-highest space-y-1.5 flex flex-col justify-between shadow-xs text-left">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="text-[10px] text-on-surface-variant font-bold leading-tight">
                                          <span className="font-mono text-secondary mr-1 bg-secondary/5 px-1 rounded">({item.code})</span>
                                          {item.label}
                                        </div>
                                        <span className={`text-[10px] font-black font-mono px-1.5 py-0.2 rounded-md ${
                                          val >= 4 ? "bg-emerald-50 text-emerald-700" : val >= 3 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                        }`}>
                                          {val} / 5
                                        </span>
                                      </div>
                                      
                                      <div className="space-y-1.5 pt-1">
                                        {isEditingScores ? (
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="range"
                                              min="1"
                                              max="5"
                                              value={val}
                                              onChange={(e) => handlePotentialMetricChange(item.field as keyof PotentialAssessment, parseInt(e.target.value))}
                                              className="flex-1 accent-secondary cursor-ew-resize"
                                            />
                                            <span className="text-[10px] font-mono font-bold">{val}</span>
                                          </div>
                                        ) : (
                                          <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                                            <div 
                                              className="bg-secondary h-1.5 rounded-full transition-all duration-300" 
                                              style={{ width: `${(val / 5) * 100}%` }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Component summary */}
                              <div className="bg-white border-t border-surface-container-highest px-4 py-3 flex flex-wrap justify-between items-center text-xs font-bold text-on-surface-variant gap-4">
                                <div className="flex flex-wrap items-center gap-4">
                                  <div>Jumlah Poin (u = sum l-t): <span className="text-on-surface font-mono font-black">{details.sumComp} / 45</span></div>
                                  <div>Target Divisor (divisor * 9): <span className="text-on-surface font-mono font-black">{divisorVal} * 9 = {details.compMax}</span></div>
                                  <div>Rasio vs Target (v = u / target): <span className="text-on-surface font-mono font-black">{(details.compRatio).toFixed(3)}</span> <span className="text-[10px] text-slate-500 font-normal dark:text-slate-400">(vs Max 45: {(details.sumComp / 45).toFixed(3)})</span></div>
                                </div>
                                <div className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-extrabold uppercase">
                                  Skor Tertimbang (z): {details.compWeighted.toFixed(1)}%
                                </div>
                              </div>

                              {/* Radar Chart Component for Managerial Competencies */}
                              {(() => {
                                const targetVal = pAss.targetLevel === "SM" ? 3.5 : 3.0;
                                const radarData = [
                                  { name: "Business Knowledge", score: pAss.businessKnowledge || 3, target: targetVal },
                                  { name: "Leadership", score: pAss.leadership || 3, target: targetVal },
                                  { name: "Problem Solving", score: pAss.problemSolving || 3, target: targetVal },
                                  { name: "Interpersonal Skill", score: pAss.interpersonalSkill || 3, target: targetVal },
                                  { name: "Strategic Mindset", score: pAss.strategicMindset || 3, target: targetVal },
                                  { name: "Manages Complexity", score: pAss.managesComplexity || 3, target: targetVal },
                                  { name: "Ensures Accountability", score: pAss.ensuresAccountability || 3, target: targetVal },
                                  { name: "Drives Vision", score: pAss.drivesVision || 3, target: targetVal },
                                  { name: "Cultivate Innovation", score: pAss.cultivateInnovation || 3, target: targetVal },
                                ];

                                return (
                                  <div className="p-4 bg-white border-t border-surface-container-highest">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                                      <div>
                                        <h5 className="font-display font-extrabold text-xs text-secondary uppercase tracking-wider flex items-center gap-2">
                                          <Target className="w-4 h-4 text-secondary" />
                                          Radar Chart Penguasaan Kompetensi Manajerial vs Standar Target
                                        </h5>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                          Visualisasi jaring 9 kompetensi manajerial {currentTalent.name} dibandingkan standar target level {pAss.targetLevel || "DM"} ({targetVal.toFixed(1)}).
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-4 text-xs font-bold">
                                        <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                          <span className="w-3 h-3 rounded-full bg-secondary inline-block"></span>
                                          Skor Talenta
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                                          Standar Target ({targetVal.toFixed(1)})
                                        </span>
                                      </div>
                                    </div>

                                    <div className="w-full h-[340px] flex items-center justify-center">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                          <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                                          <PolarAngleAxis 
                                            dataKey="name" 
                                            tick={{ fill: "#334155", fontSize: 10, fontWeight: 700 }} 
                                          />
                                          <PolarRadiusAxis 
                                            angle={30} 
                                            domain={[0, 5]} 
                                            tick={{ fill: "#64748b", fontSize: 9 }} 
                                          />
                                          <Tooltip 
                                            content={({ active, payload }) => {
                                              if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                  <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1">
                                                    <p className="font-bold text-amber-300">{data.name}</p>
                                                    <p className="text-slate-200">
                                                      Skor Real: <span className="font-mono font-bold text-emerald-400">{data.score}</span> / 5
                                                    </p>
                                                    <p className="text-slate-200">
                                                      Standar Target: <span className="font-mono font-bold text-amber-400">{data.target}</span> / 5
                                                    </p>
                                                    <p className="text-[10px] text-slate-300 pt-1 border-t border-slate-800 font-semibold">
                                                      Status: {data.score >= data.target ? "✅ Memenuhi Target" : "⚠️ Perlu Pengembangan (Gap: " + (data.score - data.target).toFixed(1) + ")"}
                                                    </p>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            }}
                                          />
                                          <Radar 
                                            name="Skor Talenta" 
                                            dataKey="score" 
                                            stroke="#2563eb" 
                                            fill="#3b82f6" 
                                            fillOpacity={0.4} 
                                          />
                                          <Radar 
                                            name="Standar Target" 
                                            dataKey="target" 
                                            stroke="#d97706" 
                                            fill="#f59e0b" 
                                            fillOpacity={0.25} 
                                          />
                                        </RadarChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* C. Study Background (10%) */}
                            <div className="border border-surface-container-highest rounded-xl overflow-hidden bg-surface/50">
                              <div className="bg-outline/5 px-4 py-3.5 border-b border-surface-container-highest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-outline text-white text-xs font-black rounded-full flex items-center justify-center">C</span>
                                  <h4 className="font-display font-black text-xs text-on-surface uppercase tracking-wider">Study Background (Bobot 10%)</h4>
                                </div>
                                <div className="text-xs font-bold text-on-surface-variant">
                                  Formula: aa = (x / divisor) * 10% = <span className="text-on-surface">{details.bgWeighted.toFixed(1)}%</span>
                                </div>
                              </div>
                              
                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white text-left">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">Latar Belakang Pendidikan (w)</label>
                                  {isEditingScores ? (
                                    <input
                                      type="text"
                                      value={pAss.studyBackgroundName}
                                      onChange={(e) => handlePotentialMetricChange("studyBackgroundName", e.target.value)}
                                      className="w-full text-xs p-2 rounded border border-surface-container-highest bg-surface focus:outline-none focus:border-primary font-bold"
                                      placeholder="Nama Gelar / Universitas"
                                    />
                                  ) : (
                                    <div className="p-2 bg-surface rounded-lg border border-surface-container-highest font-bold text-xs text-on-surface text-left">
                                      {pAss.studyBackgroundName}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">Poin Tingkatan Pendidikan (x)</label>
                                    <span className="text-[10px] font-black font-mono bg-outline/10 text-on-surface px-2 py-0.5 rounded">Gelar Level Poin: {pAss.studyBackgroundScore}</span>
                                  </div>
                                  
                                  {isEditingScores ? (
                                    <select
                                      value={pAss.studyBackgroundScore}
                                      onChange={(e) => handlePotentialMetricChange("studyBackgroundScore", parseInt(e.target.value))}
                                      className="w-full text-xs p-1.5 rounded border border-surface-container-highest bg-surface focus:outline-none font-bold cursor-pointer"
                                    >
                                      <option value={5}>5 (S3 / Pascasarjana, Skor: 5)</option>
                                      <option value={4}>4 (S1 / Magister, Skor: 4 - Standar)</option>
                                      <option value={3}>3 (D3 / Ahli Madya, Skor: 3)</option>
                                      <option value={2}>2 (SLTA / Sederajat, Skor: 2)</option>
                                      <option value={1}>1 (SMP / Dasar, Skor: 1)</option>
                                    </select>
                                  ) : (
                                    <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-2.5">
                                      <div 
                                        className="bg-outline h-1.5 rounded-full transition-all duration-300" 
                                        style={{ width: `${((pAss.studyBackgroundScore || 0) / 5) * 100}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Component summary */}
                              <div className="bg-white border-t border-surface-container-highest px-4 py-3 flex flex-wrap justify-between items-center text-xs font-bold text-on-surface-variant gap-4">
                                <div className="flex items-center gap-4">
                                  <div>Skor Pendidikan (x): <span className="text-on-surface font-mono font-black">{pAss.studyBackgroundScore}</span></div>
                                  <div>Rasio Terhadap Standar S1 (y = x / 4.0): <span className="text-on-surface font-mono font-black">{(details.bgRatio).toFixed(3)}</span></div>
                                </div>
                                <div className="bg-outline/10 text-on-surface px-3 py-1 rounded-full text-xs font-extrabold uppercase">
                                  Skor Tertimbang (aa): {details.bgWeighted.toFixed(1)}%
                                </div>
                              </div>
                            </div>

                            {/* TOTAL INTEGRATED CALCULATION BOARD */}
                            <div className="bg-primary/5 border-2 border-primary/20 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                              <div className="space-y-1">
                                <h4 className="font-display font-black text-sm text-primary uppercase tracking-wider flex items-center gap-1.5">
                                  <Sparkles className="w-4.5 h-4.5 text-primary animate-pulse" />
                                  Kalkulasi Akhir Matriks Potensi (ab)
                                </h4>
                                <p className="text-xs text-on-surface-variant font-medium">
                                  Formula: ab = k ({details.psychWeighted.toFixed(1)}%) + z ({details.compWeighted.toFixed(1)}%) + aa ({details.bgWeighted.toFixed(1)}%)
                                </p>
                                {currentTalent.customPotential && (
                                  <span className="inline-block mt-1 text-[9px] font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-200">
                                    ★ Dikalibrasi Manual dari Nine-Box Tools
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-lg border border-primary/20 shadow-sm">
                                <div className="text-left">
                                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider block font-bold">TOTAL SKOR POTENSI (X-Axis)</span>
                                  <span className="text-2xl font-black text-primary leading-none">{details.totalPotentialScore.toFixed(1)}%</span>
                                </div>
                                <div className="border-l border-surface-container-highest pl-4 text-left">
                                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider block font-bold">KLASIFIKASI KOTAK</span>
                                  <span className="text-xs font-black text-secondary uppercase block mt-0.5">
                                    {details.totalPotentialScore >= 80 ? "HIGH POTENTIAL" : details.totalPotentialScore >= 60 ? "MEDIUM POTENTIAL" : "LOW POTENTIAL"}
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </section>
                    );
                  })()}

                  {/* AJINOMOTO INDONESIA PERFORMANCE CALCULATOR PANEL (DYNAMIC YEAR EVALUATION) */}
                  {(() => {
                    const perfDetails = calculateTalentPerformanceDetails(currentTalent);
                    const evalScores = evaluationYears.map(yr => currentTalent.performanceEvaluation?.[`fy${yr}`] ?? 0);
                    const nonZeroScores = evalScores.filter(s => s > 0);
                    const avgEval = perfDetails.avgRawScore > 0 ? perfDetails.avgRawScore : (evalScores.reduce((a, b) => a + b, 0) / (evalScores.length || 1));
                    const placement = getTalentPlacement(currentTalent);

                    return (
                      <section className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-highest p-6 space-y-6 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-highest pb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                              <History className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-display text-base font-extrabold text-on-surface uppercase tracking-wide">Peta Evaluasi Kinerja (Sumbu Y)</h3>
                              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Sumbu Y : Evaluasi Kinerja (100%)</p>
                              {currentTalent.customPerformance && (
                                <span className="inline-block mt-1 text-[9px] font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-200">
                                  ★ Dikalibrasi Manual dari Nine-Box Tools
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-surface p-3 rounded-lg border border-surface-container-highest self-start sm:self-center">
                            <div className="text-right">
                              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">Rerata Kinerja (Sumbu Y)</span>
                              <span className="text-lg font-black text-emerald-700">{perfDetails.score50.toFixed(2)} / 50.00</span>
                            </div>
                            <span className={`text-xs font-black px-2.5 py-1.5 rounded border uppercase ${
                              placement.performance === "High" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : placement.performance === "Medium"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {placement.performance === "High" ? "HIGH PERFORMANCE" : placement.performance === "Medium" ? "MEDIUM PERFORMANCE" : "LOW PERFORMANCE"}
                            </span>
                          </div>
                        </div>

                        {/* Table container matching the uploaded style */}
                        <div className="border border-surface-container-highest rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                          <div className="min-w-[640px]">
                            <div 
                              className="grid bg-slate-900 text-white text-xs font-black uppercase text-center tracking-wider"
                              style={{ gridTemplateColumns: `140px repeat(${evaluationYears.length}, minmax(0, 1fr))` }}
                            >
                              <div className="py-3 border-r border-slate-700/50 bg-[#b01a43] flex items-center justify-center gap-1.5">
                                <span>EVALUATION</span>
                              </div>
                              {evaluationYears.map((yr) => (
                                <div key={yr} className="py-3 border-r last:border-r-0 border-slate-700/50 bg-[#b01a43] flex items-center justify-center">
                                  <span>FY {yr}</span>
                                </div>
                              ))}
                            </div>

                            <div 
                              className="grid text-center divide-x divide-surface-container-highest bg-surface/30"
                              style={{ gridTemplateColumns: `140px repeat(${evaluationYears.length}, minmax(0, 1fr))` }}
                            >
                              {/* Description / Label Row */}
                              <div className="p-4 bg-white font-extrabold text-xs text-slate-800 flex flex-col justify-center items-center text-left min-h-[70px]">
                                <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Kategori</div>
                                <div className="text-primary font-black mt-0.5">Rating Kinerja</div>
                              </div>

                              {evaluationYears.map((yr) => {
                                const yearKey = `fy${yr}`;
                                const value = currentTalent.performanceEvaluation?.[yearKey] ?? 0;
                                return (
                                  <div key={yr} className="p-4 bg-white flex flex-col justify-center items-center gap-1.5 min-h-[70px]">
                                    {isEditingScores ? (
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={value}
                                        onChange={(e) => handlePerformanceEvaluationChange(yearKey, parseFloat(e.target.value) || 0)}
                                        className="text-xs font-black p-1.5 rounded border border-surface-container-highest bg-slate-50 text-slate-800 focus:outline-none focus:border-primary cursor-pointer w-full text-center font-mono"
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center">
                                        <span className={`text-sm font-black font-mono px-3 py-1 rounded-lg ${
                                          (perfDetails.is0To50Scale ? value >= 37.5 : value >= 4)
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                            : (perfDetails.is0To50Scale ? value >= 25.0 : value >= 3)
                                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}>
                                          {value}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold mt-1">
                                          {perfDetails.is0To50Scale 
                                            ? (value >= 37.5 ? "Tinggi" : value >= 25.0 ? "Sedang" : value > 0 ? "Rendah" : "-")
                                            : (value === 5 ? "Istimewa" : value === 4 ? "Sangat Baik" : value === 3 ? "Baik" : value === 2 ? "Cukup" : value === 1 ? "Kurang" : "-")}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Component summary */}
                          <div className="bg-white border-t border-surface-container-highest px-4 py-3 flex flex-wrap justify-between items-center text-xs font-bold text-on-surface-variant gap-4">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div>Total Nilai: <span className="text-on-surface font-mono font-black">{evalScores.reduce((a,b)=>a+b,0).toFixed(1)}</span></div>
                              <div>Jumlah Tahun Evaluasi: <span className="text-on-surface font-mono font-black">{nonZeroScores.length || evaluationYears.length} Tahun</span></div>
                              <div>Rerata Evaluasi: <span className="text-primary font-black font-mono">{avgEval.toFixed(2)}</span></div>
                            </div>
                            <div className="bg-[#b01a43]/10 text-[#b01a43] px-3 py-1 rounded-full text-xs font-extrabold uppercase font-mono">
                              Skor Kinerja Sumbu Y: {perfDetails.score50.toFixed(2)} / 50.00 ({Math.round(perfDetails.percentage)}%)
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })()}

                  {/* Bento Grid Layout for Assessments */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Psychotest Results (Circular Radial Indicators) */}
                    <section className="lg:col-span-1 bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-highest p-6 flex flex-col h-full justify-between">
                      <div className="flex items-center justify-between mb-4 border-b border-surface-container-highest pb-3">
                        <h3 className="font-display text-base font-extrabold text-on-surface uppercase tracking-wide">Psychometric Profile</h3>
                        <Brain className="w-5 h-5 text-outline-variant" />
                      </div>
                      
                      {/* Interactive edit instruction banner */}
                      {isEditingScores && (
                        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2 text-[11px] text-amber-800 font-medium">
                          <Sliders className="w-4 h-4 flex-shrink-0 text-amber-600" />
                          <span>Drag slides below to live-simulate assessment scores.</span>
                        </div>
                      )}

                      <div className="flex-1 flex flex-col justify-around gap-6">
                        
                        {/* Metric 1 - Logical Reasoning */}
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path 
                                className="text-surface-container-highest" 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3"
                              />
                              <path 
                                className="text-primary transition-all duration-300" 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeDasharray={`${currentTalent.psychometric.logicalReasoning.score}, 100`} 
                                strokeLinecap="round" 
                                strokeWidth="3"
                              />
                            </svg>
                            <span className="absolute font-display font-bold text-sm text-on-surface">{currentTalent.psychometric.logicalReasoning.score}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-display font-bold text-xs text-on-surface uppercase tracking-wide">{currentTalent.psychometric.logicalReasoning.name}</h4>
                            <p className="text-xs text-on-surface-variant font-medium mt-0.5">{currentTalent.psychometric.logicalReasoning.description}</p>
                            
                            {/* Score adjuster slider */}
                            {isEditingScores && (
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={currentTalent.psychometric.logicalReasoning.score}
                                onChange={(e) => handleScoreChange("psychometric", "logicalReasoning", parseInt(e.target.value))}
                                className="w-full mt-2 accent-primary cursor-ew-resize"
                              />
                            )}
                          </div>
                        </div>

                        {/* Metric 2 - Leadership Potential */}
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path 
                                className="text-surface-container-highest" 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3"
                              />
                              <path 
                                className="text-secondary transition-all duration-300" 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeDasharray={`${currentTalent.psychometric.leadershipPotential.score}, 100`} 
                                strokeLinecap="round" 
                                strokeWidth="3"
                              />
                            </svg>
                            <span className="absolute font-display font-bold text-sm text-on-surface">{currentTalent.psychometric.leadershipPotential.score}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-display font-bold text-xs text-on-surface uppercase tracking-wide">{currentTalent.psychometric.leadershipPotential.name}</h4>
                            <p className="text-xs text-on-surface-variant font-medium mt-0.5">{currentTalent.psychometric.leadershipPotential.description}</p>
                            
                            {/* Score adjuster slider */}
                            {isEditingScores && (
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={currentTalent.psychometric.leadershipPotential.score}
                                onChange={(e) => handleScoreChange("psychometric", "leadershipPotential", parseInt(e.target.value))}
                                className="w-full mt-2 accent-secondary cursor-ew-resize"
                              />
                            )}
                          </div>
                        </div>

                        {/* Metric 3 - Emotional Agility */}
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path 
                                className="text-surface-container-highest" 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3"
                              />
                              <path 
                                className="text-outline transition-all duration-300" 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeDasharray={`${currentTalent.psychometric.emotionalAgility.score}, 100`} 
                                strokeLinecap="round" 
                                strokeWidth="3"
                              />
                            </svg>
                            <span className="absolute font-display font-bold text-sm text-on-surface">{currentTalent.psychometric.emotionalAgility.score}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-display font-bold text-xs text-on-surface uppercase tracking-wide">{currentTalent.psychometric.emotionalAgility.name}</h4>
                            <p className="text-xs text-on-surface-variant font-medium mt-0.5">{currentTalent.psychometric.emotionalAgility.description}</p>
                            
                            {/* Score adjuster slider */}
                            {isEditingScores && (
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={currentTalent.psychometric.emotionalAgility.score}
                                onChange={(e) => handleScoreChange("psychometric", "emotionalAgility", parseInt(e.target.value))}
                                className="w-full mt-2 accent-outline cursor-ew-resize"
                              />
                            )}
                          </div>
                        </div>

                      </div>
                    </section>

                    {/* Competency Details (Bar Charts) */}
                    <section className="lg:col-span-2 bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-highest p-6 flex flex-col h-full justify-between">
                      <div className="flex items-center justify-between mb-6 border-b border-surface-container-highest pb-3">
                        <h3 className="font-display text-base font-extrabold text-on-surface uppercase tracking-wide">Core Competencies</h3>
                        <BarChart3 className="w-5 h-5 text-outline-variant" />
                      </div>
                      
                      <div className="space-y-6 flex-1 flex flex-col justify-between">
                        {currentTalent.competencies.map((comp) => (
                          <div key={comp.name} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <h4 className="font-display font-bold text-xs text-on-surface tracking-wide uppercase">{comp.name}</h4>
                              <span className="text-xs text-secondary font-bold">{comp.label}</span>
                            </div>
                            
                            <div className="w-full bg-surface-container-highest rounded-full h-2.5 relative">
                              <div 
                                className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${comp.score}%` }}
                              />
                            </div>

                            {/* Score adjuster slider */}
                            {isEditingScores && (
                              <div className="flex items-center gap-3">
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={comp.score}
                                  onChange={(e) => handleScoreChange("competency", comp.name, parseInt(e.target.value))}
                                  className="flex-1 accent-primary cursor-ew-resize"
                                />
                                <span className="text-xs font-mono font-medium text-outline">{comp.score}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>

                  </div>
                  </motion.div>
                  )}

                  {profileSubTab === "idp-training" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      {/* Development Plan (IDP) */}
                  <section className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-highest p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-surface-container-highest pb-3">
                      <h3 className="font-display text-base font-extrabold text-on-surface uppercase tracking-wide">Individual Development Plan (IDP)</h3>
                      <TrendingUp className="w-5 h-5 text-outline-variant" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Plan Item 1 */}
                      <div className="border border-surface-container-highest rounded-lg p-5 bg-surface hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <GraduationCap className="w-4.5 h-4.5" />
                            </div>
                            <h4 className="font-display font-bold text-sm text-on-surface leading-tight">{currentTalent.idp[0].title}</h4>
                          </div>
                          <span className="bg-surface-container-highest text-on-surface-variant font-semibold text-xs px-2.5 py-1 rounded-md">
                            {currentTalent.idp[0].status}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium mb-4 leading-relaxed">{currentTalent.idp[0].description}</p>
                        
                        <div className="space-y-1">
                          <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${currentTalent.idp[0].progress}%` }} />
                          </div>
                          <div className="text-right text-xs font-bold text-secondary">{currentTalent.idp[0].progress}% Completed</div>
                        </div>
                      </div>

                      {/* Plan Item 2 */}
                      <div className="border border-surface-container-highest rounded-lg p-5 bg-surface hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                              <BookOpen className="w-4.5 h-4.5" />
                            </div>
                            <h4 className="font-display font-bold text-sm text-on-surface leading-tight">{currentTalent.idp[1].title}</h4>
                          </div>
                          <span className="bg-surface-container-highest text-outline font-semibold text-xs px-2.5 py-1 rounded-md">
                            {currentTalent.idp[1].status}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium mb-4 leading-relaxed">{currentTalent.idp[1].description}</p>
                        
                        <div className="space-y-1">
                          <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                            <div className="bg-outline h-1.5 rounded-full" style={{ width: `${currentTalent.idp[1].progress}%` }} />
                          </div>
                          <div className="text-right text-xs font-bold text-outline">{currentTalent.idp[1].progress}% Completed</div>
                        </div>
                      </div>

                    </div>
                  </section>

                  {/* Riwayat & Rencana Pelatihan (Training & Development Programs) */}
                  <section className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-highest p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-highest pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-display text-base font-extrabold text-on-surface uppercase tracking-wide">Pelatihan & Program Sertifikasi</h3>
                          <p className="text-xs text-on-surface-variant font-medium mt-0.5">Daftar program pengembangan kepemimpinan, sertifikasi, dan diklat talenta.</p>
                        </div>
                      </div>
                      {userRole === "admin" && (
                        <button
                          onClick={() => {
                            setEditingTrainingId(null);
                            setNewTraining({
                              name: "",
                              provider: "",
                              date: "",
                              type: "Leadership",
                              status: "Planned",
                              notes: ""
                            });
                            setIsAddTrainingOpen(true);
                          }}
                          className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                        >
                          <Plus className="w-4 h-4" />
                          TAMBAH PELATIHAN
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {currentTalent.trainings && currentTalent.trainings.length > 0 ? (
                        currentTalent.trainings.map((tr) => {
                          const typeColors = {
                            Leadership: "bg-emerald-50 text-emerald-700 border-emerald-100",
                            Technical: "bg-indigo-50 text-indigo-700 border-indigo-100",
                            Management: "bg-sky-50 text-sky-700 border-sky-100",
                            Certification: "bg-purple-50 text-purple-700 border-purple-100"
                          };
                          const statusColors = {
                            Planned: "bg-slate-100 text-slate-700 border-slate-200",
                            "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
                            Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            Cancelled: "bg-rose-50 text-rose-700 border-rose-200"
                          };

                          return (
                            <div key={tr.id} className="border border-surface-container-highest rounded-xl p-5 bg-surface hover:shadow-md transition-all flex flex-col justify-between text-left relative">
                              <div className="space-y-3.5">
                                <div className="flex justify-between items-start gap-2">
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${typeColors[tr.type] || "bg-gray-50 text-gray-700 border-gray-100"}`}>
                                    {tr.type}
                                  </span>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${statusColors[tr.status] || "bg-gray-50 text-gray-700 border-gray-100"}`}>
                                    {tr.status}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <h4 className="font-display font-extrabold text-sm text-on-surface leading-snug">{tr.name}</h4>
                                  <div className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1.5">
                                    <span className="font-bold text-secondary">{tr.provider}</span>
                                    <span className="text-outline">•</span>
                                    <span className="font-semibold text-outline">{tr.date}</span>
                                  </div>
                                </div>

                                {tr.notes && (
                                  <div className="p-3 bg-white rounded-lg border border-surface-container-highest/60">
                                    <span className="text-[9px] font-black text-on-surface-variant block uppercase tracking-wider mb-1">Catatan HR / Komite:</span>
                                    <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">{tr.notes}</p>
                                  </div>
                                )}
                              </div>

                              {userRole === "admin" && (
                                <div className="flex gap-2.5 mt-5 pt-3.5 border-t border-dashed border-surface-container-highest justify-end">
                                  <button
                                    onClick={() => handleStartEditTraining(tr)}
                                    className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                    title="Edit Pelatihan"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTraining(tr.id)}
                                    className="p-1.5 text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                    title="Hapus Pelatihan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10 bg-surface rounded-xl border border-dashed border-surface-container-highest">
                          <BookOpen className="w-10 h-10 text-outline-variant mx-auto mb-2" />
                          <p className="text-xs font-bold text-on-surface">Belum Ada Program Pelatihan</p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Gunakan tombol di atas untuk mendaftarkan program pelatihan khusus bagi talenta ini.</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Career Aspiration & Development Request Form - User Only */}
                  {userRole === "user" && (
                    <section className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-highest p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
                        <h3 className="font-display text-base font-extrabold text-on-surface uppercase tracking-wide">Aspirasi Karir & Pengajuan Sertifikasi</h3>
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Sebagai bagian dari program Succession Planning, Anda dapat mengajukan preferensi pelatihan dan mendaftarkan aspirasi pengembangan kepemimpinan jangka pendek Anda langsung ke Chief Talent Officer dan Komite HR.
                      </p>

                      {formSubmitted ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-3"
                        >
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-display font-bold text-sm text-emerald-900">Aspirasi Berhasil Terkirim!</h4>
                            <p className="text-xs text-emerald-800 leading-relaxed max-w-lg mx-auto">
                              Terima kasih, {currentTalent.name}. Preferensi training dan aspirasi pengembangan Anda telah masuk ke sistem HR Succession. {adminProfile.name} ({adminProfile.title}) dan tim komite akan meninjau pengajuan ini pada sesi kalibrasi berikutnya.
                            </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setFormSubmitted(false);
                              setAspirationText("");
                            }}
                            className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                          >
                            Kirim Aspirasi Baru
                          </button>
                        </motion.div>
                      ) : (
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            setFormSubmitted(true);
                          }}
                          className="space-y-5"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-on-surface block uppercase tracking-wider">Program Pelatihan yang Diminati</label>
                              <select 
                                value={preferredTraining}
                                onChange={(e) => setPreferredTraining(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-surface rounded-lg border border-surface-container-highest text-sm focus:outline-none focus:border-primary text-on-surface"
                              >
                                <option value="Sertifikasi Analisis Data Lanjutan">Sertifikasi Analisis Data Lanjutan (Python & Tableau)</option>
                                <option value="Executive Leadership Coaching Program">Executive Leadership Coaching Program (Wharton)</option>
                                <option value="Strategic Business Transformation Course">Strategic Business Transformation Course (INSEAD)</option>
                                <option value="Global Supply Chain Logistics & AI Mastery">Global Supply Chain Logistics & AI Mastery</option>
                              </select>
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-on-surface block uppercase tracking-wider">Arah Karir Jangka Pendek (1-2 Tahun)</label>
                              <select 
                                className="w-full px-3.5 py-2.5 bg-surface rounded-lg border border-surface-container-highest text-sm focus:outline-none focus:border-primary text-on-surface"
                              >
                                <option>General Manager / Kepala Divisi Bisnis Digital</option>
                                <option>VP of Operations / Direktur Operasional Regional</option>
                                <option>Senior Strategic HCM Lead</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface block uppercase tracking-wider">Deskripsi Rencana & Target Pengembangan Pribadi</label>
                            <textarea 
                              required
                              value={aspirationText}
                              onChange={(e) => setAspirationText(e.target.value)}
                              rows={4}
                              className="w-full p-4 bg-surface rounded-lg border border-surface-container-highest text-sm focus:outline-none focus:border-primary text-on-surface"
                              placeholder="Tuliskan aspirasi karir Anda, tantangan yang ingin Anda ambil, dan dukungan spesifik yang Anda harapkan dari manajemen..."
                            />
                          </div>

                          <div className="flex justify-end">
                            <button 
                              type="submit"
                              className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                              KIRIM ASPIRASI KE HR
                            </button>
                          </div>
                        </form>
                      )}
                    </section>
                  )}
                  </motion.div>
                  )}
                </motion.div>
              )}

              {/* 4. ADVISORY CONTROLS / SETTINGS VIEW */}
              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="border-b border-surface-container-highest pb-4">
                    <h1 className="font-display text-2xl md:text-3xl font-extrabold text-primary">Advisory Portal Controls</h1>
                    <p className="text-sm text-on-surface-variant">Configure talent matrix formulas, edit executive descriptions, and adjust system-wide calibration defaults.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* General Settings */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-surface-container-highest p-6 shadow-sm space-y-6">
                      <h3 className="font-display text-lg font-bold text-on-surface border-b border-surface-container-highest pb-3">Succession Configuration</h3>
                      
                      {/* Metric editor for current active profile */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-xs text-primary uppercase tracking-wide">Calibrate profile commentary</h4>
                          {isVaultEnabled && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                              isVaultLocked 
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                            }`}>
                              {isVaultLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              <span>{isVaultLocked ? "TERENKRIPSI (LOCKED)" : "TERENKRIPSI (AES-256)"}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant">Update the executive-level description shown in downloadable PDF summary reports for {currentTalent.name}.</p>
                        
                        <div className="relative">
                          {isVaultLocked && (
                            <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-950/40 backdrop-blur-md rounded-lg flex flex-col items-center justify-center p-4 text-center z-10 border border-slate-200 dark:border-slate-800">
                              <Lock className="w-7 h-7 text-rose-500 animate-pulse mb-1.5" />
                              <h5 className="font-display font-black text-xs text-rose-700 dark:text-rose-400 uppercase tracking-wider">Komentar Eksekutif Terkunci (AES-256)</h5>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mt-1 leading-normal">
                                Sistem keamanan aktif. Masukkan passphrase Anda pada panel konfigurasi di bawah untuk mendekripsi.
                              </p>
                              <div className="mt-2.5 flex gap-1.5 max-w-[240px] w-full justify-center">
                                <input 
                                  type="password"
                                  placeholder="Sandi Keamanan..."
                                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-rose-500 text-slate-900 flex-1 shadow-sm"
                                  id="commentary-quick-pass"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = (document.getElementById("commentary-quick-pass") as HTMLInputElement)?.value;
                                      if (val) handleUnlockVault(val);
                                    }
                                  }}
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const val = (document.getElementById("commentary-quick-pass") as HTMLInputElement)?.value;
                                    if (val) handleUnlockVault(val);
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  Unlock
                                </button>
                              </div>
                              {vaultError && <p className="text-[9px] text-rose-600 font-bold mt-1.5 bg-rose-50 px-2 py-0.5 rounded">{vaultError}</p>}
                            </div>
                          )}
                          
                          <textarea 
                            value={executiveCommentary[selectedTalentId] || ""}
                            onChange={(e) => {
                              handleUpdateAndEncryptCommentary(selectedTalentId, e.target.value);
                            }}
                            rows={4}
                            className={`w-full p-4 bg-surface rounded-lg border border-surface-container-highest text-sm focus:outline-none focus:border-primary text-on-surface transition-all ${
                              isVaultLocked ? 'filter blur-xs select-none select-all opacity-35' : ''
                            }`}
                            placeholder="Write executive commentary..."
                            disabled={isVaultLocked}
                          />
                        </div>
                        <span className="text-[11px] text-outline block text-right font-medium">Changes auto-save and update report PDF instantly.</span>
                      </div>

                      <div className="pt-4 border-t border-surface-container-highest space-y-4">
                        <h4 className="font-display font-bold text-xs text-secondary uppercase tracking-wide">Calibration Simulation Toggle</h4>
                        <p className="text-xs text-on-surface-variant">Enable direct slider adjustment handles directly inside the detailed Profile assessment cards.</p>
                        
                        <div className="flex items-center justify-between p-3.5 bg-surface rounded-lg border border-surface-container-highest">
                          <div className="flex items-center gap-3">
                            <Sliders className="w-5 h-5 text-primary" />
                            <div>
                              <span className="text-xs font-bold text-on-surface block">Live Score Adjustment Sliders</span>
                              <span className="text-[10px] text-on-surface-variant">Displays range selectors under each assessment ring and competence bar</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setIsEditingScores(!isEditingScores)}
                            className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${isEditingScores ? 'bg-primary' : 'bg-outline-variant'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${isEditingScores ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>

                      {/* SYSTEM APPEARANCE SETTINGS */}
                      <div className="pt-4 border-t border-surface-container-highest space-y-4">
                        <h4 className="font-display font-bold text-xs text-secondary uppercase tracking-wide">System Appearance Settings</h4>
                        <p className="text-xs text-on-surface-variant">Switch between standard light theme and a dark, eye-friendly layout to minimize glare during night shifts.</p>
                        
                        <div className="flex items-center justify-between p-3.5 bg-surface rounded-lg border border-surface-container-highest">
                          <div className="flex items-center gap-3">
                            {isDarkMode ? (
                              <Moon className="w-5 h-5 text-primary" />
                            ) : (
                              <Sun className="w-5 h-5 text-amber-500" />
                            )}
                            <div>
                              <span className="text-xs font-bold text-on-surface block">Dark Mode</span>
                              <span className="text-[10px] text-on-surface-variant">Reduces eye strain for HR admins during long night shifts</span>
                            </div>
                          </div>
                          <button 
                            id="dark-mode-toggle"
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${isDarkMode ? 'bg-primary' : 'bg-outline-variant'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>

                      {/* EDIT & SAVE PROFILING ADMIN MASTER SECTION */}
                      <div className="pt-6 border-t border-surface-container-highest space-y-4 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <User className="w-5 h-5 text-primary" />
                            <h4 className="font-display font-bold text-xs text-primary uppercase tracking-wide">Edit & Save Profiling Admin Master</h4>
                          </div>
                          {adminProfile.lastSaved && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 px-2.5 py-1 rounded-full">
                              Tersimpan: {adminProfile.lastSaved}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          Kelola informasi profil Administrator Master yang digunakan untuk otorisasi sidebar, kop laporan suksesi resmi, serta tanda tangan digital persetujuan dokumen.
                        </p>
                        
                        <form onSubmit={handleSaveAdminMasterProfile} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-surface-container-highest space-y-4">
                          {adminProfileSuccessMsg && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-lg flex items-center gap-2 animate-fade-in">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{adminProfileSuccessMsg}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Nama Administrator Master</label>
                              <input 
                                type="text"
                                required
                                value={adminProfile.name}
                                onChange={(e) => {
                                  const name = e.target.value;
                                  const words = name.trim().split(/\s+/);
                                  const initials = words.map(w => w[0]).join("").substring(0, 3).toUpperCase() || "AD";
                                  setAdminProfile({ ...adminProfile, name, initials });
                                }}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-surface-container-highest text-xs font-bold focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 shadow-xs"
                                placeholder="Nama Lengkap Admin Master"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Peran / Jabatan Admin Master</label>
                              <input 
                                type="text"
                                required
                                value={adminProfile.title}
                                onChange={(e) => setAdminProfile({ ...adminProfile, title: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-surface-container-highest text-xs font-bold focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 shadow-xs"
                                placeholder="Chief Talent Officer (Admin)"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Departemen / Unit Kerja</label>
                              <input 
                                type="text"
                                value={adminProfile.department || "Human Capital Management Dept."}
                                onChange={(e) => setAdminProfile({ ...adminProfile, department: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-surface-container-highest text-xs font-bold focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 shadow-xs"
                                placeholder="Human Capital Management"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Email Kontak Resmi Admin</label>
                              <input 
                                type="email"
                                value={adminProfile.email || "admin.hr@ajinomoto.co.id"}
                                onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-surface-container-highest text-xs font-bold focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 shadow-xs"
                                placeholder="admin.hr@ajinomoto.co.id"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Catatan Otorisasi Master Komite</label>
                            <textarea 
                              rows={2}
                              value={adminProfile.notes || "Otorisasi Administrator Master untuk Komite Talent Suksesi PT Ajinomoto Indonesia"}
                              onChange={(e) => setAdminProfile({ ...adminProfile, notes: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-surface-container-highest text-xs focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 shadow-xs"
                              placeholder="Catatan otorisasi master..."
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-surface-container-highest w-full sm:w-auto flex-1">
                              <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-display font-bold text-xs shadow-xs shrink-0">
                                {adminProfile.initials}
                              </div>
                              <div className="text-left overflow-hidden">
                                <span className="text-xs font-black text-on-surface dark:text-slate-100 block truncate">{adminProfile.name}</span>
                                <span className="text-[10px] text-on-surface-variant dark:text-slate-400 block truncate">{adminProfile.title}</span>
                              </div>
                            </div>

                            <button 
                              type="submit"
                              className="w-full sm:w-auto bg-[#b01a43] hover:bg-[#921435] text-white font-extrabold text-xs px-6 py-3 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              SIMPAN PROFILING ADMIN MASTER
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* DYNAMIC FISCAL YEAR MANAGEMENT PANEL */}
                      <div className="pt-6 border-t border-surface-container-highest space-y-4 text-left">
                        <div className="flex items-center gap-2.5">
                          <History className="w-5 h-5 text-primary" />
                          <h4 className="font-display font-bold text-xs text-primary uppercase tracking-wide">Manajemen Tahun Evaluasi (Fiscal Year Management)</h4>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          Tambahkan tahun fiskal baru (FY) untuk memperbarui data penilaian evaluasi secara dinamis. Rata-rata penilaian dan peta sebaran Y-Axis akan otomatis beradaptasi dengan perubahan ini.
                        </p>
                        
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-surface-container-highest space-y-4">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-black text-slate-500 uppercase">Tahun Aktif Saat Ini:</span>
                            {evaluationYears.map((yr) => (
                              <span key={yr} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                                <span>FY {yr}</span>
                                <button 
                                  onClick={() => handleRemoveEvaluationYear(yr)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors ml-1 focus:outline-none font-bold"
                                  title={`Hapus FY ${yr}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2 max-w-sm">
                            <input 
                              type="text"
                              id="new-fy-input"
                              placeholder="Misal: 2025"
                              maxLength={4}
                              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-primary text-slate-900 flex-1 shadow-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const val = (e.target as HTMLInputElement).value;
                                  if (val) {
                                    handleAddEvaluationYear(val);
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const el = document.getElementById("new-fy-input") as HTMLInputElement;
                                if (el && el.value) {
                                  handleAddEvaluationYear(el.value);
                                  el.value = "";
                                }
                              }}
                              className="bg-[#b01a43] hover:bg-[#921435] text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
                            >
                              Tambah FY Baru
                            </button>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 font-medium">
                            *Menambahkan tahun fiskal baru akan secara otomatis memberikan nilai dasar (Rating 3 - Baik) pada seluruh profil kandidat untuk tahun tersebut.
                          </div>
                        </div>
                      </div>

                      {/* GLOBAL READINESS CALIBRATION PANEL */}
                      <div className="pt-6 border-t border-surface-container-highest space-y-4 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-display font-bold text-xs text-primary uppercase tracking-wide">Kalibrasi Tingkat Kesiapan Talent (Global Readiness Calibration)</h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              Ubah status readiness level dari seluruh kandidat secara langsung di bawah ini.
                            </p>
                          </div>
                          
                          {/* Search Filter for Candidates */}
                          <div className="relative w-full sm:w-56">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-outline-variant" />
                            <input
                              type="text"
                              value={readinessSearch}
                              onChange={(e) => setReadinessSearch(e.target.value)}
                              placeholder="Cari nama atau posisi..."
                              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-surface-container-highest text-xs font-bold focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 shadow-xs"
                            />
                          </div>
                        </div>

                        {/* Candidate Readiness Calibration List */}
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                          {talents
                            .filter((t) =>
                              !readinessSearch.trim() ||
                              t.name.toLowerCase().includes(readinessSearch.toLowerCase()) ||
                              t.title.toLowerCase().includes(readinessSearch.toLowerCase())
                            )
                            .map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-surface-container-highest"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img src={t.avatar} className="w-9 h-9 rounded-full object-cover border border-surface shrink-0" alt={t.name} referrerPolicy="no-referrer" />
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-on-surface dark:text-slate-100 block truncate">{t.name}</span>
                                    <span className="text-[10px] text-on-surface-variant block truncate">{t.title}</span>
                                  </div>
                                </div>
                                <select
                                  value={t.readiness}
                                  onChange={(e) => handleUpdateReadiness(t.id, e.target.value)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-none shrink-0 ${
                                    t.readinessColor === "emerald"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : t.readinessColor === "amber"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  <option value="READY NOW">READY NOW</option>
                                  <option value="READY 1-2 YEARS">READY 1-2 YEARS</option>
                                  <option value="READY 2+ YEARS">READY 2+ YEARS</option>
                                </select>
                              </div>
                            ))}
                          {talents.filter((t) =>
                            !readinessSearch.trim() ||
                            t.name.toLowerCase().includes(readinessSearch.toLowerCase()) ||
                            t.title.toLowerCase().includes(readinessSearch.toLowerCase())
                          ).length === 0 && (
                            <p className="text-xs text-on-surface-variant text-center py-4">Tidak ada kandidat yang cocok dengan pencarian.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PLACEHOLDER - panel kanan (kolom asli hilang akibat file corrupt, silakan sesuaikan/hapus) */}
                    <div className="lg:col-span-1 bg-white rounded-xl border border-surface-container-highest p-6 shadow-sm space-y-4 h-fit">
                      <h3 className="font-display text-lg font-bold text-on-surface border-b border-surface-container-highest pb-3">Ringkasan Sistem</h3>
                      <div className="space-y-3 text-xs text-on-surface-variant">
                        <div className="flex items-center justify-between">
                          <span>Total Kandidat</span>
                          <span className="font-bold text-on-surface">{talents.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Ready Now</span>
                          <span className="font-bold text-emerald-600">{readyNowCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tahun Fiskal Aktif</span>
                          <span className="font-bold text-on-surface">{evaluationYears.join(", ")}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsShortcutsModalOpen(true)}
                        className="w-full text-xs font-bold text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/5 transition-colors"
                      >
                        Lihat Keyboard Shortcuts
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
