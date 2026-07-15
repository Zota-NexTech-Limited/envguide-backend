import * as dotenv from "dotenv"; dotenv.config();
const { buildEnviraanPcfInputFromRequest } = await import("./dist/repositories/pcfRequestRepository.js");
const { aggregateComputedDetail } = await import("./dist/services/pcfSubmodelService.js");
const { buildPcfV9Payload } = await import("./dist/util/buildPcfV9Payload.js");
const reqId = "01KXGC2GJ5EVE2R0F7TEN7BTV4";
const input = await buildEnviraanPcfInputFromRequest(reqId);
const d = await aggregateComputedDetail(reqId);
if (d) { input.carbonContentDetail=d.carbonContentDetail; input.productionStageDetail=d.productionStageDetail; input.packagingStageDetail=d.packagingStageDetail; input.distributionStageDetail=d.distributionStageDetail; }
const p = buildPcfV9Payload(input);
const stages = p.productLifeCycleStagesAndEmissions[0];
console.log("packaging aircraft :", stages.packagingStage[0].packagingAircraftGhgEmissions);
console.log("packaging fossil   :", stages.packagingStage[0].packagingFossilGhgEmissions);
console.log("packaging pcf incl :", stages.packagingStage[0].packagingPcfIncludingBiogenicUptake);
console.log("distribution aircft:", stages.distributionStage[0].distributionStageAircraftGhgEmissions);
console.log("carbonContentTotal :", p.carbonContent[0].carbonContentTotal);
process.exit(0);
