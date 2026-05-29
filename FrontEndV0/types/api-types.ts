export interface Source {
  title: string
  url: string
  date: string
  site: string
}

export interface BannerAssessment {
  file: string
  impacted: boolean
  explanation: string
}

export interface ApiResponse {
  answer: string
  openai_answer: string
  components_impacted: string[]
  locations_impacted: string[]
  sources: Source[]
  banner_assessments: BannerAssessment[]
}
