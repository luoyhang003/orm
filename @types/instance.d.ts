/// <reference path="DMLDriver.d.ts" />

declare namespace FxOrmInstance {
    interface InstanceDataPayload {
        [key: string]: any
    }

    interface CreateOptions {
        autoFetch?: boolean
        autoFetchLimit?: number
        cascadeRemove?: boolean
        uid?: string
        is_new?: boolean
        isShell?: boolean
        autoSave?: boolean
        extra?: InstanceConstructorOptions['extra']
        extra_info?: InstanceConstructorOptions['extra_info']
    }
    interface SaveOptions {
        saveAssociations?: boolean
    }

    type InstanceChangeRecords = string[]

    interface InstanceConstructorOptions {
        table: string
        keys?: FxOrmModel.ModelConstructorOptions['keys']
        originalKeyValues?: InstanceDataPayload

        data?: InstanceDataPayload
        changes?: InstanceChangeRecords
        extra?: string[] | FxOrmProperty.NormalizedPropertyHash
        extra_info?: {
            table: string
            id: string[]
            id_prop: string[]
            assoc_prop: string[]
        }

        is_new?: boolean
        isShell?: boolean
        autoSave?: FxOrmModel.ModelConstructorOptions['autoSave']
        methods?: FxOrmModel.ModelConstructorOptions['methods']

        keyProperties: FxOrmProperty.NormalizedProperty[]
        validations: FxOrmValidators.IValidatorHash
        hooks: FxOrmModel.ModelConstructorOptions['hooks']

        one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
        many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[]
        extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[]
        // collection of assoc property's key
        association_properties: string[]

        uid: FxOrmDMLDriver.DriverUidType
        driver: FxOrmDMLDriver.DMLDriver

        setupAssociations: {
            (instance: Instance): void
        }
        fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType
        events?: {
            [k: string]: FxOrmNS.GenericCallback<any>
        }
    }

    interface InnerInstanceOptions extends InstanceConstructorOptions {
        associations?: {
            [key: string]: FxOrmAssociation.InstanceAssociationItemInformation
        }
        extrachanges: InstanceChangeRecords
    }

    type InstanceConstructor = new (model: FxOrmModel.Model, opts: InstanceConstructorOptions) => FxOrmInstance.Instance

    type InstanceEventType = 
        'ready' | 'save' | 'beforeRemove' | 'remove'
    interface Instance extends FxOrmSynchronous.SynchronizedInstance {
        saved(): boolean;
        remove(callback: FxOrmNS.VoidCallback): Instance;
        validate: {
            (callback: FxOrmNS.ValidatorCallback): void
        };
        on(event: InstanceEventType | string, callback: FxOrmNS.GenericCallback<any>): Instance;
        $on: Class_EventEmitter['on']
        $off: Class_EventEmitter['off']
        $emit: Class_EventEmitter['emit']
        
        save(callback?: FxOrmNS.VoidCallback): Instance;
        save(data: InstanceDataPayload, callback?: FxOrmNS.VoidCallback): Instance;
        save(data: InstanceDataPayload, options: SaveOptions, callback?: FxOrmNS.VoidCallback): Instance;
        saved(): boolean;
        remove(callback?: FxOrmNS.VoidCallback): Instance;

        /**
         * @noenum
         */
        isInstance: boolean;
        /**
         * @noenum
         */
        isPersisted(): boolean;
        /**
         * @noenum
         */
        isShell(): boolean;

        /**
         * @noenum
         */
        set: (path: string|string[], value: any) => void;
        markAsDirty: (propName: string) => void;
        dirtyProperties: {[key: string]: any};

        /**
         * @noenum
         */
        __singleton_uid(): string | number;

        /**
         * @noenum
         */
        __opts?: InnerInstanceOptions;

        /**
         * @noenum
         */
        // model: Model;
        model(): FxOrmModel.Model;

        /**
         * @warn only valid in corresponding hook
         */
        readonly $hookRef: {
            // for beforeCreate/afterCreate
            create: {
                instance: Instance,
                useChannel: FxOrmHook.HookChannel
            },
            // for beforeSave/afterSave
            save: {
                instance: Instance,
                useChannel: FxOrmHook.HookChannel
            },
            // for beforeRemove/afterRemove
            remove: {
                instance: Instance,
                useChannel: FxOrmHook.HookChannel
            },
        }

        [extraProperty: string]: any;
    }

    class Class_Instance extends Class_EventEmitter {
        readonly $kvs: Fibjs.AnyObject

        readonly $saved: boolean
        readonly $isPersisted: boolean
        readonly $changes: any
        readonly $changedFieldsCount: number

        readonly $model: FxOrmModel.Class_Model


        /**
         * @description create one instance from data input
         * 
         * if input is just one instance, New() would create the new one rather than use old one
         * 
         * @param input dataset for creating one instance
         */
        constructor (
            model: FxOrmModel.Class_Model,
            input?: Fibjs.AnyObject
        );

        $on: Class_EventEmitter['on']
        $off: Class_EventEmitter['off']
        $emit: Class_EventEmitter['emit']
         
        $set (prop: string | string[], value: any): void
        /**
         * @description
         *  fetch all properties(not all fields, not includes associations) from remote endpoints,
         *  update instance automatically
         */
        $fetch (): this
        /**
         * 
         * @param fieldName just fetch field name (list) from remote endpoints, but never update local instance,
         * just return field-value object
         */
        $get (fieldName: string | string[]): Fibjs.AnyObject
        $save: {
            (kvs?: Fibjs.AnyObject): Class_Instance
            (kvs: Fibjs.AnyObject[]): Class_Instance[]
        }
        $remove (): void
        $exists (): boolean
        $clearChanges(fieldName?: string | string[]): void


        toString (): string
        toJSON (): Class_Instance['$kvs'];

        [k: string]: any
    }
}