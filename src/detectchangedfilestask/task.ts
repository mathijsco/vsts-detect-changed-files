import * as tl from "azure-pipelines-task-lib/task";
import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import * as path from "./path";

interface ICommitResponse {
    _links: {
        changes: {
            href: string;
        }
    };
}

interface IChangesResponse {
    changes: Array<{
        item: {
            path: string;
            gitObjectType: "blob" | "tree";
            isFolder: boolean;
            //changeType: "edit" | "add" | "rename" | "delete"
        }
    }>;
}

interface ISettings {
    commitId: string;
    repositoryUri: string;
    accessToken: string;
    monitorPath: string;
    variableName: string;
    alwaysUpdateVariable: boolean;
}

function getEnvironmentSetting(key: string, secret?: boolean): string {
    const value = process.env[key];
    if (!value) {
        throw Error(`Environment variable '${key}' is not set.`);
    } else {
        tl.debug(`ENV VAR '${key}'=${secret === true ? "*****" : "'" + value + "'"}`);
    }
    return value;
}

function getSettings(): ISettings {
    const sourceDirectory = getEnvironmentSetting("BUILD_SOURCESDIRECTORY");

    return {
        commitId: getEnvironmentSetting("BUILD_SOURCEVERSION"),
        repositoryUri: getEnvironmentSetting("BUILD_REPOSITORY_URI"),
        accessToken: getEnvironmentSetting("SYSTEM_ACCESSTOKEN", true),

        monitorPath: path.removeBasePath(sourceDirectory, tl.getPathInput("monitorPath", true)!),
        variableName: tl.getInput("targetVariable", true)!,
        alwaysUpdateVariable: tl.getBoolInput("alwaysUpdateVariable", false),
    };
}

async function run() {
    try {
        const settings = getSettings();

        // Forget the login user name is any. This is added when using dev.azure.com
        const repositoryUri = settings.repositoryUri.replace(/:\/\/\w+@/, '://');

        // replace 'https://myaccount.visualstudio.com/MyProject/_git/RepositoryName' to 'https://myaccount.visualstudio.com/MyProject/_apis/git/repositories/RepositoryName/commits/1234564897841864214d14?api-version=1.0'
        const repositoryApiUri = repositoryUri.replace(/\/_git\//, "/_apis/git/repositories/") + "/commits/" + settings.commitId + "?api-version=1.0";

        // Agent.BuildDirectory = c:\agent\_work\1
        // Agent.WorkFolder = c:\agent\_work
        // Build.ArtifactStagingDirectory = c:\agent\_work\1\a
        // Build.BinariesDirectory = c:\agent\_work\1\b
        // BUILD_REPOSITORY_LOCALPATH= c:\agent\_work\1\s
        // BUILD_SOURCESDIRECTORY = c:\agent\_work\1\s
        // SYSTEM_DEFAULTWORKINGDIRECTORY = c:\agent\_work\1\s

        const monitorPath = settings.monitorPath;
        const axiosConfig: AxiosRequestConfig = {
            headers: {
                Authorization: "Bearer " + settings.accessToken,
            }
        };
        
        tl.debug(`Downloading from '${repositoryApiUri}'...`);
        const commitResponse = await axios.get<ICommitResponse>(repositoryApiUri, axiosConfig);
        tl.debug(`Downloading from '${commitResponse.data._links.changes.href}'...`);
        const changesResponse = await axios.get<IChangesResponse>(commitResponse.data._links.changes.href, axiosConfig);

        tl.debug(`Found a total of ${changesResponse.data.changes.length} changes in the changeset`);

        let result: boolean = false;
        for (const change of changesResponse.data.changes) {
            // only check for file changes
            if (change.item.gitObjectType === "blob") {
                const itemPath = path.normalizePath(change.item.path);

                if (path.isInPath(monitorPath, itemPath)) {
                    tl.debug(`Detected a change in file '${itemPath}'`);
                    result = true;
                }
            }
        }

        if (result === false) {
            tl.debug(`No files changed in path '${monitorPath}'`);
        }

        if (result === true) {
            tl.setVariable(settings.variableName, "true");
        } else if (settings.alwaysUpdateVariable) {
            tl.setVariable(settings.variableName, "false");
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();