/// <reference path="model.d.ts" />
/// <reference path="instance.d.ts" />

declare namespace FxOrmSynchronous {
    interface VoidReturn {
        (): void
    }
    interface UnknownReturn {
        (): any
    }

    interface SynchronizedModel {
        findSync: {
            (conditions?: FxOrmModel.ModelQueryConditions__Find, options?: FxOrmModel.ModelOptions__Find): FxOrmInstance.Instance[]
            (conditions: FxOrmModel.ModelQueryConditions__Find, limit: number, order: string[]): FxOrmInstance.Instance[]
        }
        allSync: SynchronizedModel['findSync']
        whereSync: SynchronizedModel['findSync']

        countSync: FxOrmModel.Model['count']
        existsSync: {
            (conditions: FxOrmModel.ModelQueryConditions__Find): FxOrmInstance.Instance
        }
        oneSync: {
            (conditions?: FxOrmModel.ModelQueryConditions__Find, options?: FxOrmModel.ModelOptions__Find): FxOrmInstance.Instance
            (conditions?: FxOrmModel.ModelQueryConditions__Find, order?: string[]): FxOrmInstance.Instance
        }

        createSync: {
            (data: FxOrmInstance.InstanceDataPayload): FxOrmInstance.Instance;
            (data: FxOrmInstance.InstanceDataPayload[]): FxOrmInstance.Instance[];
        }
        getSync: {
            (...ids: any[]): FxOrmInstance.Instance; // this Instance is from its callback
        }

        // it's callback version could return `this: ORM`
        syncSync: VoidReturn
        clearSync: VoidReturn
        dropSync: UnknownReturn

        /**
         * other patched synchronous version method
         * - lazyLoad: getXXXSync, setXXXSync, removeXXXSync
         * - association: [addAccessor]Sync, [getAccessor]Sync, [hasAccessor]Sync, [setAccessor]Sync, [removeAccessor]Sync
         */
        [ek: string]: any
    }

    interface SynchronizedInstance {
        saveSync: {
            (): FxOrmInstance.Instance
        }
        removeSync: {
            (): void
        }
        validateSync: {
            (): false | FxOrmError.ExtendedError[]
        }
        /**
         * other patched synchronous version method
         * - lazyLoad: getXXXSync, setXXXSync, removeXXXSync
         * - association: [addAccessor]Sync, [getAccessor]Sync, [hasAccessor]Sync, [setAccessor]Sync, [removeAccessor]Sync
         */
        [ek: string]: any
    }

    // TODO: to implement it.
    interface SynchronizedIChainFind {

    }

    interface SynchronizedORMInstance {
        // it's callback version could return `this: ORM`
        syncSync: VoidReturn
        closeSync: VoidReturn
        dropSync: VoidReturn
        pingSync: VoidReturn
    }
}