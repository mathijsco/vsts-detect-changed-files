export function removeBasePath(basePath: string, path: string): string {
    basePath = normalizePath(basePath);
    path = normalizePath(path);
    if (path.startsWith(basePath)) {
        // normalize again to remove any slash that might remain
        return normalizePath(path.slice(basePath.length));
    }
    return path;
}

export function normalizePath(path: string): string {
    return path
        .replace(/\\/g, "/") // replace the slashes to a normal slash
        .replace(/(^[\/\\]+|[\/\\]+$)/g, ""); // remove the starting and trailing slashes
}

export function isInPath(rootPath: string, subPath: string): boolean {
    return subPath === rootPath || subPath.startsWith(rootPath + "/");
}