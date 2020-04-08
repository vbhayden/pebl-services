import { PeBLPlugin } from "../models/peblPlugin";
import { CompetencyManager } from "../interfaces/competencyManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";

export class DefaultCompetencyManager extends PeBLPlugin implements CompetencyManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
  }

  validateGetCompetencies(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveCompetencies(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteCompetencies(payload: { [key: string]: any }): boolean {
    return false;
  }

  // getCompetencies(userProfile: UserProfile, callback: ((competencies: Competency[]) => void)): void {
  // 	this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + competenciesKey, function(err, result) {
  // 		if (err) {
  // 			//TODO: handle error
  // 			callback([]);
  // 		} else {
  // 			callback(result.map(function(x) {
  // 				return new Competency(JSON.parse(x));
  // 			}));
  // 		}
  // 	})
  // }

  // saveCompetencies(userProfile: UserProfile, competencies: Competency[]): void {
  // 	let arr = [];
  // 	for (let competency of competencies) {
  // 		arr.push(this.getCompetenciesKey(competency.id));
  // 		arr.push(JSON.stringify(competency));
  // 	}
  // 	this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + competenciesKey, arr);
  // }

  // deleteCompetency(userProfile: UserProfile, id: string): void {
  // 	this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + competenciesKey, this.getCompetenciesKey(id), function(err, res) {
  // 		if (err) {
  // 			//TODO
  // 		} else {
  // 			//TODO
  // 		}
  // 	});
  // }

}
