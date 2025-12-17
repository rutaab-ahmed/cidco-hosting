export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PlotRecord {
  ID: string;
  NAME_OF_NODE: string;
  SECTOR_NO_: string;
  BLOCK_ROAD_NAME: string;
  PLOT_NO_AFTER_SURVEY: string;
  PLOT_NO_: string;
  SUB_PLOT_NO_: string;
  UID: string;
  
  // Dates & Names
  DATE_OF_ALLOTMENT?: string;
  NAME_OF_ORIGINAL_ALLOTTEE?: string;
  
  // Areas & Metrics
  PLOT_AREA_SQM_?: string;
  BUILTUP_AREA_SQM_?: string;
  USE_OF_PLOT_ACCORDING_TO_FILE?: string;
  TOTAL_PRICE_RS_?: string;
  RATE_SQM_?: string;
  LEASE_TERM_YEARS_?: string;
  FSI?: string;
  
  // Certificates
  COMENCEMENT_CERTIFICATE?: string;
  OCCUPANCY_CERTIFICATE?: string;
  
  // Transfers (Note: Dates now have leading underscore in DB)
  NAME_OF_2ND_OWNER?: string;
  _2ND_OWNER_TRANSFER_DATE?: string;
  NAME_OF_3RD_OWNER?: string;
  _3RD_OWNER_TRANSFER_DATE?: string;
  NAME_OF_4TH_OWNER?: string;
  _4TH_OWNER_TRANSFER_DATE?: string;
  NAME_OF_5TH_OWNER?: string;
  _5TH_OWNER_TRANSFER_DATE?: string;
  NAME_OF_6TH_OWNER?: string;
  _6TH_OWNER_TRANSFER_DATE?: string;
  NAME_OF_7TH_OWNER?: string;
  _7TH_OWNER_TRANSFER_DATE?: string;
  NAME_OF_8TH_OWNER?: string;
  _8TH_OWNER_TRANSFER_DATE?: string;
  NAME_OF_9TH_OWNER?: string;
  _9TH_OWNER_TRANSFER_DATE?: string;
  NAME_OF_10TH_OWNER?: string;
  _10TH_OWNER_TRANSFER_DATE?: string;
  NAME_OF_11TH_OWNER?: string;
  _11TH_OWNER_TRANSFER_DATE?: string;

  // Remarks & Locations
  INVESTIGATOR_REMARKS?: string;
  INVESTIGATOR_NAME?: string;
  FILE_LOCATION?: string;
  FILE_NAME?: string;
  
  // Survey
  TOTAL_AREA_SQM?: string;
  USE_OF_PLOT?: string;
  SUB_USE_OF_PLOT?: string;
  PLOT_STATUS?: string;
  SURVEY_REMARKS?: string;
  PHOTO_FOLDER?: string;
  PLANNING_USE?: string;
  
  // Invoice & Counts
  PLOT_AREA_FOR_INVOICE?: string;
  PLOT_USE_FOR_INVOICE?: string;
  Tentative_Plot_Count?: string;
  Minimum_Plot_Count?: string;
  Additional_Plot_Count?: string;
  Percentage_Match?: string;
  
  // Other
  Department_Remark?: string;
  MAP_AREA?: string;
  SUBMISSION?: string;
  IMAGES_PRESENT?: string;
  PDFS_PRESENT?: string;

  // UI Helpers (computed on backend)
  has_pdf: boolean;
  has_map: boolean;
  images: string[];

  // Dynamic access
  [key: string]: any; 
}

export interface SummaryData {
  category: string; // Generic name for Use or Remark
  area: number;
  additionalCount: number;
  percent: number;
}