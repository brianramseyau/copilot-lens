// Shape of a single row from the GitHub Copilot usage NDJSON export.
// One record = one user's activity totals for a single calendar day.

export interface PluginVersionInfo {
  sampled_at: string;
  plugin?: string;
  plugin_version?: string;
  ide_version?: string;
  cli_version?: string;
}

export interface IdeTotal {
  ide: string;
  user_initiated_interaction_count: number;
  code_generation_activity_count: number;
  code_acceptance_activity_count: number;
  loc_suggested_to_add_sum: number;
  loc_suggested_to_delete_sum: number;
  loc_added_sum: number;
  loc_deleted_sum: number;
  last_known_plugin_version?: PluginVersionInfo;
  last_known_ide_version?: PluginVersionInfo;
}

export interface FeatureTotal {
  feature: string;
  user_initiated_interaction_count: number;
  code_generation_activity_count: number;
  code_acceptance_activity_count: number;
  loc_suggested_to_add_sum: number;
  loc_suggested_to_delete_sum: number;
  loc_added_sum: number;
  loc_deleted_sum: number;
}

export interface LanguageFeatureTotal {
  language: string;
  feature: string;
  code_generation_activity_count: number;
  code_acceptance_activity_count: number;
  loc_suggested_to_add_sum: number;
  loc_suggested_to_delete_sum: number;
  loc_added_sum: number;
  loc_deleted_sum: number;
}

export interface LanguageModelTotal {
  language: string;
  model: string;
  code_generation_activity_count: number;
  code_acceptance_activity_count: number;
  loc_suggested_to_add_sum: number;
  loc_suggested_to_delete_sum: number;
  loc_added_sum: number;
  loc_deleted_sum: number;
}

export interface ModelFeatureTotal {
  model: string;
  feature: string;
  user_initiated_interaction_count: number;
  code_generation_activity_count: number;
  code_acceptance_activity_count: number;
  loc_suggested_to_add_sum: number;
  loc_suggested_to_delete_sum: number;
  loc_added_sum: number;
  loc_deleted_sum: number;
}

export interface CliTotal {
  session_count: number;
  request_count: number;
  prompt_count: number;
  token_usage?: {
    output_tokens_sum: number;
    prompt_tokens_sum: number;
    avg_tokens_per_request: number;
  };
  last_known_cli_version?: PluginVersionInfo;
}

export interface AiAdoptionPhase {
  phase_number: number;
  phase: string;
  version: string;
}

export interface UsageRecord {
  report_start_day: string;
  report_end_day: string;
  day: string;
  organization_id: string;
  enterprise_id: string;
  user_id: number;
  user_login: string;
  user_initiated_interaction_count: number;
  code_generation_activity_count: number;
  code_acceptance_activity_count: number;
  totals_by_ide: IdeTotal[];
  totals_by_feature: FeatureTotal[];
  totals_by_language_feature: LanguageFeatureTotal[];
  totals_by_language_model: LanguageModelTotal[];
  totals_by_model_feature: ModelFeatureTotal[];
  totals_by_cli?: CliTotal;
  used_agent: boolean;
  used_chat: boolean;
  used_cli?: boolean;
  used_copilot_coding_agent?: boolean;
  used_copilot_cloud_agent?: boolean;
  used_copilot_app?: boolean;
  loc_suggested_to_add_sum: number;
  loc_suggested_to_delete_sum: number;
  loc_added_sum: number;
  loc_deleted_sum: number;
  ai_adoption_phase: AiAdoptionPhase;
  ai_credits_used: number;
}

export interface CostRecord {
  date: string;
  username: string;
  product: string;
  sku: string;
  model: string;
  quantity: number;
  unit_type: string;
  applied_cost_per_quantity: number;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  total_monthly_quota: number;
  organization: string;
  repository: string;
  cost_center_name: string;
  aic_quantity: number;
  aic_gross_amount: number;
  input: number;
  output: number;
  cache_read: number;
  cache_write: number;
}

export interface CostIngestResult {
  records: CostRecord[];
  files: string[];
}

export interface IngestResult {
  records: UsageRecord[];
  duplicateCount: number;
  files: string[];
  cost: CostIngestResult;
}
