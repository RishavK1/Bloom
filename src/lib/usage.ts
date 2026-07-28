import {RateLimiterPrisma} from "rate-limiter-flexible";
import { prisma } from "./db";
import { auth } from "@clerk/nextjs/server";

const FREE_POINTS = 5;
const PRO_POINTS = 100;
const DURATION = 30 * 24 * 60 * 60; // 30 days
const GENERATION_COST = 1;

const PROMPT_ENHANCE_FREE_POINTS = 15;
const PROMPT_ENHANCE_PRO_POINTS = 60;
const PROMPT_ENHANCE_DURATION = 24 * 60 * 60; // 1 day


export async function getUsageTracker (){
    const {has} = await auth();
    const hasProAccess =  has({plan: "pro"});
     const usageTracker = new RateLimiterPrisma({
            storeClient: prisma,
            tableName: "Usage",
            points: hasProAccess ? PRO_POINTS : FREE_POINTS,
            duration: DURATION,
        });
        return usageTracker; 

    
}

export  async function consumeCredits (){
    const {userId} = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }
    const usageTracker = await getUsageTracker();
    const result = await usageTracker.consume(userId, GENERATION_COST);
    return result;

}

export async function getUsageStatus(){

    const {userId} = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }
    const usageTracker = await getUsageTracker();
    const result = await usageTracker.get(userId);
    return result;
}

export async function consumePromptEnhanceCredits(){
    const {userId, has} = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }
    const hasProAccess = has({plan: "pro"});
    const enhanceTracker = new RateLimiterPrisma({
        storeClient: prisma,
        tableName: "Usage",
        keyPrefix: "enhance",
        points: hasProAccess ? PROMPT_ENHANCE_PRO_POINTS : PROMPT_ENHANCE_FREE_POINTS,
        duration: PROMPT_ENHANCE_DURATION,
    });
    return enhanceTracker.consume(userId, 1);
}