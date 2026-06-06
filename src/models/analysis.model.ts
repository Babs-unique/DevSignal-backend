import mongoose from "mongoose";

interface Analysis{
  user: mongoose.Types.ObjectId;

  // Inputs
  roleTitle: string;
  companyName?: string;
  resumeFileName?: string;
  resumeText: string;
  jobDescription: string;

  // Main Result
  matchScore: number;

  analysisSummary: {
    overallAssessment: string;
    marketReadiness: string;
    hiringLikelihood: string;
  };

  existingSkills: {
    skill: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    confidence: number;
    category: string;
  }[];

  missingSkills: {
    skill: string;
    importance:
      | "Nice to Have"
      | "Recommended"
      | "Important"
      | "Critical";
    category: string;
    reason: string;
  }[];

  recommendationActions: {
    title: string;
    description: string;
    category: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    estimatedTime: string;
    careerImpact:
      | "Low Impact"
      | "Medium Impact"
      | "High Impact"
      | "Very High Impact";
  }[];

  keywordAnalysis: {
    matchedKeywords: string[];
    missingKeywords: string[];
  };

  resumeFeedback: {
    strengths: string[];
    weaknesses: string[];
  };

  radarChartData: {
    skill: string;
    userScore: number;
    marketExpectedScore: number;
  }[];

  createdAt: Date;
  updatedAt: Date;
}
const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: new mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    roleTitle: {
      type: String,
      required: true,
    },

    companyName: String,

    resumeFileName: String,

    resumeText: {
      type: String,
      required: true,
    },

    jobDescription: {
      type: String,
      required: true,
    },

    matchScore: Number,

    analysisSummary: {
      overallAssessment: String,
      marketReadiness: String,
      hiringLikelihood: String,
    },

    existingSkills: [
      {
        skill: String,
        level: String,
        confidence: Number,
        category: String,
      },
    ],

    missingSkills: [
      {
        skill: String,
        importance: String,
        category: String,
        reason: String,
      },
    ],

    recommendationActions: [
      {
        title: String,
        description: String,
        category: String,
        difficulty: String,
        estimatedTime: String,
        careerImpact: String,
      },
    ],

    keywordAnalysis: {
      matchedKeywords: [String],
      missingKeywords: [String],
    },

    resumeFeedback: {
      strengths: [String],
      weaknesses: [String],
    },

    radarChartData: [
      {
        skill: String,
        userScore: Number,
        marketExpectedScore: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

analysisSchema.index({
  user: 1,
  createdAt: -1,
});


export const Analysis = mongoose.model<Analysis>('Analysis' , analysisSchema);
