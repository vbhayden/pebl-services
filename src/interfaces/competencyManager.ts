import { PeBLPlugin } from "../models/peblPlugin";

export interface CompetencyManager extends PeBLPlugin {


  validateGetCompetencies(payload: { [key: string]: any }): boolean;
  validateSaveCompetencies(payload: { [key: string]: any }): boolean;
  validateDeleteCompetencies(payload: { [key: string]: any }): boolean;

  // getCompetencies(identity: string, callback: ((competencies: Competency[]) => void)): void; //Retrueve competencies for this user
  // saveCompetencies(identity: string, competencies: Competency[]): void; //Store competencies for this user
  // deleteCompetency(identity: string, id: string): void; //Removes the competency with the specified id
}
