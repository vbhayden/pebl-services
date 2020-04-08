import { PeBLPlugin } from "../models/peblPlugin";

export interface CompetencyManager extends PeBLPlugin {


  validateGetCompetencies(payload: { [key: string]: any }): boolean;
  validateSaveCompetencies(payload: { [key: string]: any }): boolean;
  validateDeleteCompetencies(payload: { [key: string]: any }): boolean;

  // getCompetencies(userProfile: UserProfile, callback: ((competencies: Competency[]) => void)): void; //Retrueve competencies for this user
  // saveCompetencies(userProfile: UserProfile, competencies: Competency[]): void; //Store competencies for this user
  // deleteCompetency(userProfile: UserProfile, id: string): void; //Removes the competency with the specified id
}
