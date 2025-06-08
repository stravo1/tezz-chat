import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";
import { appInfo } from "#shared/config/appInfo";

export function initSuperTokensUI() {
    (window as any).supertokensUIInit("supertokensui", {
        appInfo,
        recipeList: [
            (window as any).supertokensUIThirdParty.init({
                signInAndUpFeature: {
                    providers: [
                        (window as any).supertokensUIThirdParty.Github.init(),
                        (window as any).supertokensUIThirdParty.Google.init(),
                    ],
                },
            }),
            (window as any).supertokensUIPasswordless.init({
                contactMethod: "EMAIL_OR_PHONE",
            }),
            (window as any).supertokensUISession.init(),
        ],
    });
}

export function initSuperTokensWebJS() {
    SuperTokens.init({
        appInfo,
        recipeList: [Session.init()],
    });
}