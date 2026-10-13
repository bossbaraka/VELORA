export type Locale = "en" | "ar";
export type L10n = Record<Locale, string>;
export type Scores = {
  privacy: number;
  outdoor: number;
  family: number;
  investment: number;
};
export type Intent = "home" | "investment" | "retreat" | "family" | "private";
export interface Property {
  id: string;
  slug: string;
  name: L10n;
  type: "villa" | "apartment" | "penthouse" | "townhouse" | "commercial";
  price: { amount: number; currency: "AED" };
  area_sqft: number;
  bedrooms: number;
  bathrooms: number;
  location: {
    city: L10n;
    district: L10n;
    waterfront_min: number;
    downtown_min: number;
    airport_min: number;
    dining_min?: number;
  };
  tags: string[];
  editorialTags: L10n[];
  scores: Scores;
  story: L10n;
  designed_for: L10n[];
  materials: {
    id: string;
    name: L10n;
    usedIn: L10n;
    role: L10n;
    image: string;
  }[];
  features: L10n[];
  images: { day: string[]; night?: string[] };
  floorplan?: string;
  orientation?: "north" | "south" | "east" | "west" | "corner";
  availability: "available" | "reserved" | "sold" | "coming_soon";
  is_private: boolean;
  label?: string;
  similarPropertyIds?: string[];
  advisorId: string;
}
export interface Advisor {
  id: string;
  name: L10n;
  monogram: string;
  role: L10n;
  languages: L10n;
  bio: L10n;
}
export interface Article {
  slug: string;
  title: L10n;
  excerpt: L10n;
  category: L10n;
  readingTime: number;
  cover: string;
  body: L10n[];
}
export interface SearchParams {
  type?: Property["type"];
  bedrooms?: number;
  lifestyle: string[];
  waterfront?: boolean;
  location?: string;
  features: string[];
}

/** Evidence-aware, session-only client brief for the catalogue-led advisor. */
export type AdvisorSource = "stated" | "inferred";
export type AdvisorFirmness = "required" | "preferred";
export interface AdvisorField<T> {
  value: T;
  source: AdvisorSource;
  firmness?: AdvisorFirmness;
}
export interface AdvisorBudget {
  min?: number;
  max?: number;
  currency: string;
}
export type AdvisorPreference =
  | "quiet"
  | "privacy"
  | "family"
  | "outdoor"
  | "waterfront"
  | "cityProximity"
  | "airportProximity"
  | "diningProximity"
  | "pool"
  | "garden"
  | "terrace";
export type AdvisorFeature =
  | "pool"
  | "garden"
  | "terrace"
  | "waterfront"
  | "quiet"
  | "family"
  | "privacy";
export interface AdvisorRelaxation {
  field: AdvisorConstraintKey;
  values?: Array<string | number>;
}
export type AdvisorCriterion =
  | AdvisorPreference
  | "budget"
  | "location"
  | "propertyType"
  | "bedrooms"
  | "area"
  | "features";
export type AdvisorInvestmentFocus = "longTerm" | "rental" | "resale";
export type AdvisorQuestionKey =
  | "primaryNeed"
  | "budget"
  | "investmentFocus"
  | "investmentCriteria"
  | "quietVsCity"
  | "bedrooms"
  | "privacyEvidence"
  | "refineResults";
export type AdvisorConstraintKey =
  | "budget"
  | "cities"
  | "districts"
  | "propertyTypes"
  | "minBedrooms"
  | "minAreaSqft"
  | "maxDowntownMinutes"
  | "maxWaterfrontMinutes"
  | "maxAirportMinutes"
  | "maxDiningMinutes"
  | "mustHave"
  | "excludedFeatures"
  | "excludedCities"
  | "excludedDistricts"
  | "excludedPropertyTypes";
export type AdvisorBriefField =
  | "objective"
  | AdvisorConstraintKey
  | "preferences"
  | "investmentFocus"
  | "timeline";
export interface AdvisorBrief {
  objective?: AdvisorField<Intent>;
  budget?: AdvisorField<AdvisorBudget>;
  cities?: AdvisorField<string[]>;
  districts?: AdvisorField<string[]>;
  propertyTypes?: AdvisorField<Property["type"][]>;
  minBedrooms?: AdvisorField<number>;
  minAreaSqft?: AdvisorField<number>;
  maxDowntownMinutes?: AdvisorField<number>;
  maxWaterfrontMinutes?: AdvisorField<number>;
  maxAirportMinutes?: AdvisorField<number>;
  maxDiningMinutes?: AdvisorField<number>;
  mustHave?: AdvisorField<AdvisorFeature[]>;
  preferences?: AdvisorField<AdvisorPreference[]>;
  excludedFeatures?: AdvisorField<AdvisorFeature[]>;
  excludedCities?: AdvisorField<string[]>;
  excludedDistricts?: AdvisorField<string[]>;
  excludedPropertyTypes?: AdvisorField<Property["type"][]>;
  investmentFocus?: AdvisorField<AdvisorInvestmentFocus>;
  timeline?: AdvisorField<string>;
  priorities: Partial<Record<AdvisorCriterion, number>>;
  unresolvedQuestions: AdvisorQuestionKey[];
  declinedQuestions: AdvisorQuestionKey[];
  relaxedConstraints: AdvisorRelaxation[];
}
export type AdvisorCopyKey =
  | "advisorResponseReady"
  | "advisorResponseNeedMore"
  | "advisorResponseNoResults"
  | "advisorResponseScope"
  | "advisorResponseInvestment"
  | "advisorResponsePrivacy"
  | "advisorResponseNoBudget"
  | "advisorResponseUpdated"
  | "advisorResponseEmpty"
  | "advisorResponseReset"
  | "advisorResponseUnsupportedCurrency"
  | "advisorAskPrimary"
  | "advisorAskBudget"
  | "advisorAskInvestmentFocus"
  | "advisorAskInvestmentCriteria"
  | "advisorAskQuietCity"
  | "advisorAskBedrooms"
  | "advisorAskPrivacy"
  | "advisorAskRefine"
  | "advisorRelaxBudget"
  | "advisorRelaxLocation"
  | "advisorRelaxDistrict"
  | "advisorRelaxType"
  | "advisorRelaxBedrooms"
  | "advisorRelaxArea"
  | "advisorRelaxDowntown"
  | "advisorRelaxWaterfront"
  | "advisorRelaxAirport"
  | "advisorRelaxDining"
  | "advisorRelaxFeature"
  | "advisorRelaxExcludedFeature"
  | "advisorRelaxExcludedLocation"
  | "advisorRelaxExcludedType"
  | "advisorQuickOpenBudget"
  | "advisorQuickRental"
  | "advisorQuickLongTerm"
  | "advisorQuickResale"
  | "advisorQuickQuietLeads"
  | "advisorQuickCityLeads"
  | "advisorQuickEqual"
  | "advisorQuickQuiet"
  | "advisorQuickOutdoor"
  | "advisorQuickCity"
  | "advisorQuickUseQuiet"
  | "advisorQuickKeepUnknown"
  | "advisorQuickFlexible"
  | "advisorQuickBedroomChoice"
  | "advisorQuickHome"
  | "advisorQuickInvestment"
  | "advisorQuickRetreat"
  | "advisorQuickFamily"
  | "advisorQuickPrivate"
  | "advisorConstraintBudget"
  | "advisorConstraintLocation"
  | "advisorConstraintDistrict"
  | "advisorConstraintType"
  | "advisorConstraintBedrooms"
  | "advisorConstraintArea"
  | "advisorConstraintDowntown"
  | "advisorConstraintWaterfront"
  | "advisorConstraintAirport"
  | "advisorConstraintDining"
  | "advisorConstraintFeature"
  | "advisorConstraintExcludedFeature"
  | "advisorConstraintExcludedLocation"
  | "advisorConstraintExcludedType"
  | "advisorStrictBudget"
  | "advisorStrictBudgetFloor"
  | "advisorStrictCity"
  | "advisorStrictDistrict"
  | "advisorStrictType"
  | "advisorStrictBedrooms"
  | "advisorStrictArea"
  | "advisorStrictDowntown"
  | "advisorStrictWaterfront"
  | "advisorStrictAirport"
  | "advisorStrictDining"
  | "advisorStrictFeature"
  | "advisorStrictExcludedFeature"
  | "advisorStrictExcludedCity"
  | "advisorStrictExcludedDistrict"
  | "advisorStrictExcludedType"
  | "advisorInferredSignalsDisclosure"
  | "advisorBudgetOnlyOrder"
  | "advisorPriorityOrder"
  | "advisorModeDisclosure"
  | "advisorInvestmentDisclosure"
  | "advisorPrivacyDisclosure"
  | "advisorTimelineDisclosure"
  | "advisorCurrencyDisclosure"
  | "advisorEvidenceBudget"
  | "advisorEvidenceBedrooms"
  | "advisorEvidenceCity"
  | "advisorEvidenceDistrict"
  | "advisorEvidenceType"
  | "advisorEvidenceArea"
  | "advisorEvidenceFeature"
  | "advisorEvidenceQuietTag"
  | "advisorEvidenceFamilyTag"
  | "advisorEvidenceWaterfront"
  | "advisorEvidenceDowntown"
  | "advisorEvidenceAirport"
  | "advisorEvidenceDining"
  | "advisorEvidenceAvailable"
  | "advisorEvidenceWithinBudget"
  | "advisorEvidenceBudgetFloor"
  | "advisorEvidenceBedroomMinimum"
  | "advisorEvidenceLocation"
  | "advisorEvidenceExclusion"
  | "advisorTradeoffBudget"
  | "advisorTradeoffBedrooms"
  | "advisorTradeoffLocation"
  | "advisorTradeoffDistrict"
  | "advisorTradeoffType"
  | "advisorTradeoffArea"
  | "advisorTradeoffFeature"
  | "advisorTradeoffQuiet"
  | "advisorTradeoffFamily"
  | "advisorTradeoffOutdoor"
  | "advisorTradeoffWaterfront"
  | "advisorTradeoffDowntown"
  | "advisorTradeoffAirport"
  | "advisorTradeoffDining"
  | "advisorTradeoffPrivacyUnknown"
  | "advisorTradeoffRelaxedExcludedFeature"
  | "advisorTradeoffRelaxedLocation"
  | "advisorTradeoffRelaxedDistrict"
  | "advisorTradeoffRelaxedType"
  | "advisorTradeoffInvestmentUnknown"
  | "advisorTradeoffTimelineUnknown"
  | "advisorReasonLabel"
  | "advisorTradeoffLabel"
  | "advisorFeaturePool"
  | "advisorFeatureGarden"
  | "advisorFeatureTerrace"
  | "advisorFeatureWaterfront"
  | "advisorFeatureQuiet"
  | "advisorFeatureFamily"
  | "advisorFeaturePrivacy"
  | "advisorPreferenceQuiet"
  | "advisorPreferencePrivacy"
  | "advisorPreferenceFamily"
  | "advisorPreferenceOutdoor"
  | "advisorPreferenceWaterfront"
  | "advisorPreferenceCityProximity"
  | "advisorPreferenceAirportProximity"
  | "advisorPreferenceDiningProximity"
  | "advisorPreferencePool"
  | "advisorPreferenceGarden"
  | "advisorPreferenceTerrace"
  | "advisorSourceStated"
  | "advisorSourceInferred"
  | "advisorRequired"
  | "advisorPreferred"
  | "advisorObjective"
  | "advisorBudgetUnknown"
  | "advisorLocationUnknown"
  | "advisorBedroomsUnknown"
  | "advisorPrivacyUnknown"
  | "advisorFinancialUnknown"
  | "advisorUnknown"
  | "advisorUnderstood"
  | "advisorStillOpen"
  | "advisorBriefEmpty"
  | "advisorEditHint"
  | "advisorNoRecommendations"
  | "advisorCompareSelected"
  | "advisorStartNew"
  | "advisorSend"
  | "advisorInputHint"
  | "advisorEnterMessage"
  | "advisorOpenProperty"
  | "advisorSave"
  | "advisorSaved"
  | "advisorCompare"
  | "advisorCompared"
  | "advisorRemoveField"
  | "advisorReset"
  | "advisorResetLabel"
  | "advisorConversation"
  | "advisorUserMessage"
  | "advisorAssistantMessage"
  | "advisorResults"
  | "advisorTradeoffs"
  | "advisorIllustrativePrice"
  | "advisorNoLiveData"
  | "advisorSessionOnly"
  | "advisorNotFinancialAdvice"
  | "advisorRelatedCollection"
  | "advisorUnknownPreference"
  | "advisorMore"
  | "advisorNoBudgetOption";
export type AdvisorEvidenceKey = Extract<AdvisorCopyKey, string>;
export interface AdvisorEvidence {
  key: AdvisorEvidenceKey;
  values?: Record<string, string | number>;
}
export interface AdvisorRecommendation {
  propertyId: string;
  reasons: AdvisorEvidence[];
  tradeoffs: AdvisorEvidence[];
}
export type AdvisorAction =
  | { type: "setObjective"; objective: Intent }
  | { type: "setPreference"; preference: AdvisorPreference }
  | { type: "answer"; question: AdvisorQuestionKey; value: string }
  | { type: "relax"; field: AdvisorConstraintKey }
  | { type: "clear"; field: AdvisorBriefField };
export interface AdvisorSuggestion {
  label: { key: AdvisorCopyKey; values?: Record<string, string | number> };
  action: AdvisorAction;
}
export interface AdvisorQuestion {
  id: AdvisorQuestionKey;
  key: AdvisorCopyKey;
  choices: AdvisorSuggestion[];
}
export interface AdvisorNoResults {
  strictCriteria: AdvisorEvidence[];
  alternatives: AdvisorSuggestion[];
}
export interface AdvisorResponse {
  reply: { key: AdvisorCopyKey; values?: Record<string, string | number> };
  recommendations: AdvisorRecommendation[];
  recommendationIds: string[];
  followUp?: AdvisorQuestion;
  noResults?: AdvisorNoResults;
  notes: AdvisorEvidence[];
  orderNote?: AdvisorCopyKey;
}
export interface AdvisorExchange {
  updatedBrief: AdvisorBrief;
  response: AdvisorResponse;
}
export type AdvisorMessage =
  | { id: string; role: "client"; text: string }
  | { id: string; role: "advisor"; exchange: AdvisorExchange };
