// (C) 2020 GoodData Corporation
import { PackageDescriptor, SourceDescriptor } from "../base/types";
import chokidar from "chokidar";
import path from "path";
import { logWarn } from "../cli/loggers";
import { DcEvent, EventBus, GlobalEventBus, IEventListener, PackageChange, packagesChanged } from "./events";
import { appLogImportant } from "./ui/utils";
import { TargetDescriptor } from "../base/types";
import { intersection } from "lodash";

/**
 * Change detector will wait until it has both source & target descriptors. After that it will determine
 * what source directories to watch. It will accumulate file change records and periodically determine which
 * packages they belong to, and then fire PackagesChanged event.
 *
 * The change detector supports target switching. If it receives TargetSelected again, it will re-initialize.
 *
 * Note: upon reinit it keeps the accumulated file changes on purpose. These will be processed and dispatched
 * normally.
 */
export class ChangeDetector implements IEventListener {
    /*
     * set after handling sourceInitialized
     */
    private sourceDescriptor: SourceDescriptor | undefined;

    /*
     * set after handling targetInitialized
     */
    private targetDescriptor: TargetDescriptor | undefined;

    /*
     * set after targetInitialized
     */
    private watcher: chokidar.FSWatcher | undefined;

    private timeoutId: any | undefined;
    private accumulatedFileChanges: string[] = [];

    constructor(private readonly eventBus: EventBus = GlobalEventBus) {
        this.eventBus.register(this);
    }

    public onEvent = (event: DcEvent): void => {
        switch (event.type) {
            case "sourceInitialized": {
                this.sourceDescriptor = event.body.sourceDescriptor;

                break;
            }
            case "targetSelected": {
                this.targetDescriptor = event.body.targetDescriptor;

                // close previous instance which may be monitoring completely different set of dirs
                this.close();
                // then start new instance of chokidar for just the selected target packages
                this.startWatchingForChanges();

                break;
            }
        }
    };

    private close = (): void => {
        if (this.watcher) {
            this.watcher.close();
        }
    };

    private onSourceChange = (target: string, _type: "add" | "change" | "unlink"): void => {
        this.accumulatedFileChanges.push(target);

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.timeoutId = setTimeout(this.processAccumulatedChanges, 100);
    };

    private startWatchingForChanges = (): void => {
        const packages = Object.values(this.sourceDescriptor!.packages);
        const targetDependsOn = this.targetDescriptor!.dependencies.map((dep) => dep.pkg);
        const scope = intersection(packages, targetDependsOn);

        const watcher = chokidar.watch(createWatchDirs(scope), {
            atomic: true,
            persistent: true,
            ignoreInitial: true,
            cwd: this.sourceDescriptor!.root,
        });

        watcher
            .on("add", (path) => this.onSourceChange(path, "add"))
            .on("change", (path) => this.onSourceChange(path, "change"))
            .on("unlink", (path) => this.onSourceChange(path, "unlink"));

        appLogImportant("Package change detector started.");
    };

    private identifyChangedPackage = (file: string): PackageChange | undefined => {
        const libEndsIndex = file.indexOf("/", file.indexOf("/") + 1);

        if (libEndsIndex === -1) {
            logWarn(`Unable to find SDK lib to which ${file} belongs.`);

            return undefined;
        }

        const libDir = file.substr(0, libEndsIndex);
        const sdkPackage = this.sourceDescriptor!.packagesByDir[libDir];

        if (!sdkPackage) {
            logWarn(
                `Unable to find SDK lib to which ${file} belongs. Cannot match ${libDir} to an SDK package.`,
            );

            return undefined;
        }

        return {
            packageName: sdkPackage.packageName,
            files: [file.substr(libEndsIndex + 1)],
        };
    };

    private processAccumulatedChanges = (): void => {
        const changes: Record<string, PackageChange> = {};
        const fileChanges = this.accumulatedFileChanges;
        this.accumulatedFileChanges = [];

        for (const file of fileChanges) {
            const change = this.identifyChangedPackage(file);

            if (!change) {
                break;
            }

            const { packageName } = change;
            const existingRequest = changes[packageName];

            if (!existingRequest) {
                changes[packageName] = change;
            } else {
                existingRequest.files!.push(...change.files!);
            }
        }

        this.eventBus.post(packagesChanged(Object.values(changes)));
    };
}

function createWatchDirs(packages: PackageDescriptor[]): string[] {
    return packages.map((pkg) => {
        return path.join(pkg.directory, "src");
    });
}
