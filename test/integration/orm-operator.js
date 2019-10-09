var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("ORM Operators", function () {
    var db = null;
    var Person = null;
    var Pet = null;

    var setup = function () {
        Person = db.define("person", {
            name: String
        });

        Pet = db.define("pet", {
            name: String
        });

        return helper.dropSync([Person, Pet], function () {
            Person.create([{
                id: 1,
                name: "John Doe"
            }, {
                id: 2,
                name: "Jane Doe"
            }, {
                id: 3,
                name: "John Doe"
            }]);

            Pet.create([
                {
                    name: "Dan"
                },
                {
                    name: "Deco"
                }
            ])
        });
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.close();
    });

    describe("Orm has operators", function () {
        const util = require('util')

        assert.ok(util.isSymbol(ORM.Op.eq))
        assert.ok(util.isSymbol(ORM.Op.gt))
        assert.ok(util.isSymbol(ORM.Op.gte))
        assert.ok(util.isSymbol(ORM.Op.lt))
        assert.ok(util.isSymbol(ORM.Op.lte))
    });

    describe("find", function () {
        describe("with conditions", function () {
            before(setup);

            it("should return all items in model", function () {
                var people = Person.find({
                    where: {
                        name: 'John Doe'
                    }
                });
                assert.propertyVal(people, 'length', 2);
                // auto asc order
                assert.propertyVal(people[0], Person.id, 1);
            });

            describe("Operator eq, nq, gt(e), lt(e), is, not", function () {
                before(setup);
                
                it('complex', function () {
                    var people = Person.find({
                        where: {
                            id: {
                                [ORM.Op.gt]: 1
                            },
                            name: {
                                [ORM.Op.eq]: 'John Doe'
                            }
                        }
                    });
                    assert.propertyVal(people, 'length', 1);
                    assert.propertyVal(people[0], Person.id, 3);
                });
                
                it('is', function () {
                    var people = Person.find({
                        where: {
                            id: {
                                [ORM.Op.is]: 1
                            }
                        }
                    });
                    assert.propertyVal(people, 'length', 1);
                    assert.propertyVal(people[0], Person.id, 1);

                    var people = Person.find({
                        where: {
                            id: {
                                [ORM.Op.is]: null
                            }
                        }
                    });
                    assert.propertyVal(people, 'length', 0);
                });
                
                it('not', function () {
                    var people = Person.find({
                        where: {
                            id: {
                                [ORM.Op.not]: 1
                            }
                        }
                    });
                    assert.propertyVal(people, 'length', 2);
                    assert.propertyVal(people[0], Person.id, 2);

                    var people = Person.find({
                        where: {
                            id: {
                                [ORM.Op.not]: null
                            }
                        }
                    });
                    assert.propertyVal(people, 'length', 3);
                    assert.propertyVal(people[0], Person.id, 1);
                });
            });

            it("Operator in, notIn", function () {
                var people = Person.find({
                    where: {
                        id: {
                            [ORM.Op.in]: [1]
                        }
                    }
                });
                assert.propertyVal(people, 'length', 1);
                assert.propertyVal(people[0], Person.id, 1);

                var people = Person.find({
                    where: {
                        id: {
                            [ORM.Op.notIn]: [2]
                        }
                    }
                });
                assert.propertyVal(people, 'length', 2);
                assert.propertyVal(people[0], Person.id, 1);
                assert.propertyVal(people[1], Person.id, 3);
            });

            it("Operator between, notBetween", function () {
                var people = Person.find({
                    where: {
                        id: {
                            [ORM.Op.between]: [1, 2]
                        }
                    }
                });
                assert.propertyVal(people, 'length', 2);
                assert.propertyVal(people[0], Person.id, 1);
                assert.propertyVal(people[1], Person.id, 2);

                var people = Person.find({
                    where: {
                        id: {
                            [ORM.Op.notBetween]: [1, 4]
                        }
                    }
                });
                assert.propertyVal(people, 'length', 0);
            });

            it("Operator like, notLike", function () {
                var people = Person.find({
                    where: {
                        name: {
                            [ORM.Op.like]: 'John %'
                        }
                    }
                });
                assert.propertyVal(people, 'length', 2);
                assert.propertyVal(people[0], Person.id, 1);

                var people = Person.find({
                    where: {
                        name: {
                            [ORM.Op.notLike]: 'John %'
                        }
                    }
                });
                assert.propertyVal(people, 'length', 1);
                assert.propertyVal(people[0], Person.id, 2);
            });
        });
    });

    describe("count", function () {
        describe("with conditions", function () {
            before(setup);

            it("should return only matching items", function () {
                var count = Person.count({
                    where: {
                        name: "John Doe"
                    }
                });
                assert.equal(count, 2);
            });

            describe("Operator eq, nq, gt(e), lt(e), is, not", function () {
                before(setup);
                
                it('complex', function () {
                    var count = Person.count({
                        where: {
                            id: {
                                [ORM.Op.gt]: 1
                            },
                            name: {
                                [ORM.Op.eq]: 'John Doe'
                            }
                        }
                    });
                    assert.equal(count, 1);
                });
                
                it('is', function () {
                    var count = Person.count({
                        where: {
                            id: {
                                [ORM.Op.is]: 1
                            }
                        }
                    });
                    assert.equal(count, 1);

                    var count = Person.count({
                        where: {
                            id: {
                                [ORM.Op.is]: null
                            }
                        }
                    });
                    assert.equal(count, 0);
                });
                
                it('not', function () {
                    var count = Person.count({
                        where: {
                            id: {
                                [ORM.Op.not]: 1
                            }
                        }
                    });
                    assert.equal(count, 2);

                    var count = Person.count({
                        where: {
                            id: {
                                [ORM.Op.not]: null
                            }
                        }
                    });
                    assert.equal(count, 3);
                });
            });
            
            it("Operator in, notIn", function () {
                var count = Person.count({
                    where: {
                        id: {
                            [ORM.Op.in]: [1]
                        }
                    }
                });
                assert.equal(count, 1);

                var count = Person.count({
                    where: {
                        id: {
                            [ORM.Op.notIn]: [2]
                        }
                    }
                });
                assert.equal(count, 2);
            });

            it("Operator between, notBetween", function () {
                var count = Person.count({
                    where: {
                        id: {
                            [ORM.Op.between]: [1, 2]
                        }
                    }
                });
                assert.equal(count, 2);

                var count = Person.count({
                    where: {
                        id: {
                            [ORM.Op.notBetween]: [1, 4]
                        }
                    }
                });
                assert.equal(count, 0);
            });

            it("Operator like, notLike", function () {
                var count = Person.count({
                    where: {
                        name: {
                            [ORM.Op.like]: 'John %'
                        }
                    }
                });
                assert.equal(count, 2);

                var count = Person.count({
                    where: {
                        name: {
                            [ORM.Op.notLike]: 'John %'
                        }
                    }
                });
                assert.equal(count, 1);
            });
        });
    });
});