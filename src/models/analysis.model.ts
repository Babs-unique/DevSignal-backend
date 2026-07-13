import mongoose, { Schema } from "mongoose";

export interface Analysis{
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
    experienceLevel: String, 
    formatScore: Number, 
    impactWords: {           
      type: String,
      enum: ["Needs Work", "Average", "Good", "Excellent"]
    }
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

  isDeleted:boolean,
  deletedAt:Date

  createdAt: Date;
  updatedAt: Date;
}
const analysisSchema = new Schema<Analysis>(
  {
    user: {
      type: Schema.Types.ObjectId,
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
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,  
  }
);

analysisSchema.index({
  user: 1,
  createdAt: -1,
});


export const Analysis = mongoose.model<Analysis>('Analysis' , analysisSchema);
