import ThirdParty from "supertokens-node/recipe/thirdparty";
import Passwordless from "supertokens-node/recipe/passwordless";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import UserRoles from "supertokens-node/recipe/userroles";
import { appInfo } from "#shared/config/appInfo";
import { type TypeInput } from "supertokens-node/types";
import SuperTokens from "supertokens-node";
import { uniqueNamesGenerator, Config, adjectives, colors, animals, names } from 'unique-names-generator';

import { db } from '../db';
import { user } from '../db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';



/**
 * Configuration for username generator
 */
const nameGeneratorConfig: Config = {
  dictionaries: [colors, names, animals],
  separator: '',
  style: 'capital',
  length: 2
};

/**
 * Generate a friendly, memorable username
 * @returns A unique username like "PurplePanda" or "SkyMango"
 */
function generateFriendlyUsername(): string {
  return uniqueNamesGenerator(nameGeneratorConfig);
}

/**
 * Generates a DiceBear avatar URL based on the provided name
 * @param name The name to use as seed for the avatar
 * @returns URL string for the avatar
 */
function generateProfilePicture(name: string): string {
  // Sanitize the name to be URL-safe
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=cafe33&facialHair=beard,scruff&mouthProbability=10&earringsProbability=50&glassesProbability=90&skinColor=ecad80,f2d3b1,ecad80&mouth=laughing,pucker,smirk`;
}

async function createOrUpdateUser(userId: string, email: string, providedName?: string): Promise<void> {
    try {
        // Generate a friendly username if one wasn't provided or is too short
        const userName = (providedName && providedName.length > 3) 
            ? providedName 
            : generateFriendlyUsername();
            
        const profilePicture = generateProfilePicture(userName);
        const now = new Date().toISOString();
        
        const userData = {
            id: userId,
            email,
            name: userName,
            profilePicture,
            plan: "FREE" as const,
            createdAt: now,
            updatedAt: now
        };
    
        const existingUser = await db.query.user.findFirst({
            where: (user, { eq }) => eq(user.id, userId)
        });
    
        if (existingUser) {
            await db.update(user)
                .set({
                    updatedAt: userData.updatedAt
                })
                .where(eq(user.id, userId));
        } else {
            await db.insert(user).values(userData);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Validation error creating/updating user:', error.errors);
        } else {
          console.error('Database error creating/updating user:', error);
        }
      }
}

export let backendConfig = (): TypeInput => {
    return {
        isInServerlessEnv: true,
        supertokens: {
            connectionURI: "https://st-dev-8b0aad20-da7b-11ef-8c4b-53905c1f8f99.aws.supertokens.io",
            apiKey: process.env.NUXT_SUPERTOKENS_API_KEY,
        },
        appInfo,
        recipeList: [
            ThirdParty.init({
                signInAndUpFeature: {
                    providers: [
                        {
                            config: {
                                thirdPartyId: "google",
                                clients: [
                                    {
                                        clientId: "684994442881-2rit05pld9gq22a8a4sm3t896d1gkh5a.apps.googleusercontent.com",
                                        clientSecret: process.env.NUXT_GOOGLE_AUTH_SECRET_KEY,
                                    },
                                ],
                            },
                        },
                        {
                            config: {
                                thirdPartyId: "github",
                                clients: [
                                    {
                                        clientId: process.env.NUXT_GITHUB_CLIENT_ID,
                                        clientSecret: process.env.NUXT_GITHUB_AUTH_SECRET_KEY,
                                    },
                                ],
                            },
                        },
                    ],
                },
                override: {
                    functions: (originalImplementation) => {
                        return {
                            ...originalImplementation,
                            signInUp: async (input) => {
                                // First call the original implementation
                                const response = await originalImplementation.signInUp(input);
                                
                                if (response.status === "OK") {
                                    try {
                                        const { id } = response.user;
                                        
                                        // Safely get the first email if available
                                        const email = Array.isArray(response.user.emails) && response.user.emails.length > 0 
                                            ? response.user.emails[0] 
                                            : id + '@khub.chaton10x.tech'; // Fallback email
                                        
                                        // Try to get display name from the provider info
                                        let name = generateFriendlyUsername();
                                        
                                        // Save user to our database
                                        await createOrUpdateUser(id, email, name);
                                    } catch (error) {
                                        console.error("Error in ThirdParty signInUp override:", error);
                                    }
                                }
                                
                                return response;
                            },
                        };
                    },
                },
            }),
            Passwordless.init({
                contactMethod: "EMAIL_OR_PHONE",
                flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
                override: {
                    functions: (originalImplementation) => {
                        return {
                            ...originalImplementation,
                            consumeCode: async (input) => {
                                // First call the original implementation
                                const response = await originalImplementation.consumeCode(input);
                                
                                if (response.status === "OK") {
                                    try {
                                        const { id } = response.user;
                                        
                                        // Generate a default email using the user ID if we can't find a real one
                                        let email = id + '@khub.chaton10x.tech';
                                        let name = generateFriendlyUsername();
                                        
                                        // Try to get the actual login method info from user object
                                        if (response.user.loginMethods && response.user.loginMethods.length > 0) {
                                            const method = response.user.loginMethods[0];
                                            
                                            // Check for email
                                            if (method.email) {
                                                email = method.email;
                                            } 
                                            // Check for phone
                                            else if (method.phoneNumber) {
                                                email = method.phoneNumber + '@phone.khub.chaton10x.tech';
                                            }
                                        }
                                        
                                        await createOrUpdateUser(id, email, name);
                                    } catch (error) {
                                        console.error("Error in Passwordless consumeCode override:", error);
                                    }
                                }
                                
                                return response;
                            },
                        };
                    },
                },
            }),
            Session.init(),
            Dashboard.init(),
            UserRoles.init(),
        ],
    };
};

let initialized = false;
export function ensureSuperTokensInit() {
    if (!initialized) {
        SuperTokens.init(backendConfig());
        initialized = true;
        console.log('🔒 SuperTokens initialized with ThirdParty and Passwordless recipes');
    }
}