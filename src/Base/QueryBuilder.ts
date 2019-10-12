import util = require('util');
import SqlQuery = require('@fxjs/sql-query');

import * as SYMBOLS from '../Utils/symbols';
import { configurable } from '../Decorators/accessor';
import { buildDescriptor } from '../Decorators/property';

function transformToQCIfModel (
    target: Class_QueryBuilder,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<Function>
) {
    let method = descriptor.value;

    descriptor.value = function () {
        // in-model
        if (this.notQueryBuilder) {
            const qc = new Class_QueryBuilder()
            qc.model = this;

            return qc[propertyName].apply(qc, arguments)
        }

        // just in Class_QueryBuilder
        switch (this.model.dbdriver.type) {
            case 'mysql':
            case 'mssql':
            case 'sqlite':
                this.sqlQuery = new SqlQuery.Query({
                    dialect: this.model.dbdriver.type,
                });
                break
        }

        return method.apply(this, arguments);
    }
}

function isIdsInput (id: any) {
    return util.isArray(id) || typeof id === 'string' || (typeof id === 'number' && !isNaN(id))
}

class Class_QueryBuilder<TUPLE_ITEM = any> implements FxOrmQueries.Class_QueryBuilder<TUPLE_ITEM> {
    @buildDescriptor({ enumerable: false, configurable: false })
    private _tuples: TUPLE_ITEM[] = [];

    model: any;

    conditions: any;
    sqlQuery: FxSqlQuery.Class_Query

    [k: string]: any;

    @configurable(false)
    get _symbol () { return SYMBOLS.QueryBuilder };
    get notQueryBuilder () { return this.constructor !== Class_QueryBuilder };

    /**
     * @description find tuples from remote endpoints
     */
    @transformToQCIfModel
    getQueryBuilder () {
        return this
    }

    /**
     * @description find tuples from remote endpoints
     */
    @transformToQCIfModel
    find (
        opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']> = {}
    ): TUPLE_ITEM[] {
        const results = this.model.$dml.find(this.model.collection, opts)

        this._tuples = results.map((x: TUPLE_ITEM) => {
            const inst = this.model.New(this.model.normalizeDataToProperties(x))
            inst.$isPersisted = true
            return inst
        });

        return Array.from(this._tuples);
    }

    /**
     * @description get first tuple from remote endpoints
     */
    one (
        opts?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>
    ): TUPLE_ITEM {
        return this.find(opts)[0]
    }

    /**
     * @description get first tuple from remote endpoints
     */
    @transformToQCIfModel
    get (
        id?: string | number | FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>['where'],
    ): TUPLE_ITEM {
        let where: Fibjs.AnyObject
        
        if (isIdsInput(id))
            where = {[this.model.id]: id}

        const opts = <FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>>{}
        opts.where = {...opts.where, ...where}

        return this.find(opts)[0];
    }

    /**
     * @description check if one item existed in remote endpoints
     */
    @transformToQCIfModel
    exists (
        id?: string | number | FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['count']>['where']
    ): boolean {
        if (isIdsInput(id))
            return !!this.get(id)
        else
            return !!this.one({ where: id })
    }

    /**
     * @description count tuples from remote endpoints
     */
    @transformToQCIfModel
    count (
        opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['count']> = {}
    ): number {
        return this.model.$dml.count(
            this.model.collection,
            opts
        )
    }

    first (): TUPLE_ITEM {
        return util.first(this._tuples);
    }

    last (): TUPLE_ITEM {
        return util.last(this._tuples);
    }

    all (): TUPLE_ITEM[] {
        return Array.from(this._tuples);
    }
}

export default Class_QueryBuilder