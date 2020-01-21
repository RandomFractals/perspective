/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const data = [
    {x: 1, y: "a", z: true},
    {x: 2, y: "b", z: false},
    {x: 3, y: "c", z: true},
    {x: 4, y: "d", z: false}
];

const int_float_data = [
    {w: 1.5, x: 1, y: "a", z: true},
    {w: 2.5, x: 2, y: "b", z: false},
    {w: 3.5, x: 3, y: "c", z: true},
    {w: 4.5, x: 4, y: "d", z: false}
];
module.exports = perspective => {
    describe("computed columns", function() {
        describe("constructors", function() {
            it("Computed column of arity 0", async function() {
                var table = perspective.table(data);

                let table2 = table.add_computed([
                    {
                        column: "const",
                        type: "integer",
                        func: () => 1,
                        inputs: []
                    }
                ]);
                let view = table2.view({columns: ["const"], aggregates: {const: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{const: 1}, {const: 1}, {const: 1}, {const: 1}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 1", async function() {
                var table = perspective.table(data);

                let table2 = table.add_computed([
                    {
                        column: "const",
                        type: "string",
                        func: x => x + "123",
                        inputs: ["y"]
                    }
                ]);
                let view = table2.view({columns: ["const"], aggregates: {const: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{const: "a123"}, {const: "b123"}, {const: "c123"}, {const: "d123"}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "ratio",
                        type: "float",
                        func: (w, x) => w / x,
                        inputs: ["w", "x"]
                    }
                ]);
                let view = table2.view({columns: ["ratio"], aggregates: {ratio: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{ratio: 1.5}, {ratio: 1.25}, {ratio: 1.1666666666666667}, {ratio: 1.125}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, add ints", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "sum",
                        type: "float",
                        func_name: "+",
                        func: (w, x) => w + x,
                        inputs: ["x", "x"]
                    }
                ]);
                let view = table2.view({columns: ["sum"], aggregates: {sum: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{sum: 2}, {sum: 4}, {sum: 6}, {sum: 8}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, add floats", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "sum",
                        type: "float",
                        func_name: "+",
                        func: (w, x) => w + x,
                        inputs: ["w", "w"]
                    }
                ]);
                let view = table2.view({columns: ["sum"], aggregates: {sum: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{sum: 3}, {sum: 5}, {sum: 7}, {sum: 9}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, add mixed", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "sum",
                        type: "float",
                        func_name: "+",
                        func: (w, x) => w + x,
                        inputs: ["w", "x"]
                    }
                ]);
                let view = table2.view({columns: ["sum"], aggregates: {sum: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{sum: 2.5}, {sum: 4.5}, {sum: 6.5}, {sum: 8.5}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2 with updates on non-dependent columns, construct from schema", async function() {
                var meta = {
                    w: "float",
                    x: "float",
                    y: "string",
                    z: "boolean"
                };
                var table = perspective.table(meta, {index: "y"});
                let table2 = table.add_computed([
                    {
                        column: "ratio",
                        type: "float",
                        func: (w, x) => w / x,
                        inputs: ["w", "x"]
                    }
                ]);

                table2.update(int_float_data);

                let delta_upd = [
                    {y: "a", z: false},
                    {y: "b", z: true},
                    {y: "c", z: false},
                    {y: "d", z: true}
                ];
                table2.update(delta_upd);
                let view = table2.view({columns: ["y", "ratio"], aggregates: {y: "count", ratio: "count"}});
                let result = await view.to_json();
                let expected = [
                    {y: "a", ratio: 1.5},
                    {y: "b", ratio: 1.25},
                    {y: "c", ratio: 1.1666666666666667},
                    {y: "d", ratio: 1.125}
                ];
                expect(result).toEqual(expected);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("String computed column of arity 1", async function() {
                var table = perspective.table(data);

                let table2 = table.add_computed([
                    {
                        column: "yes/no",
                        type: "string",
                        func: z => (z === true ? "yes" : "no"),
                        inputs: ["z"]
                    }
                ]);
                let view = table2.view({columns: ["yes/no"], aggregates: {"yes/no": "count"}});
                let result = await view.to_json();
                let expected = [{"yes/no": "yes"}, {"yes/no": "no"}, {"yes/no": "yes"}, {"yes/no": "no"}];
                expect(result).toEqual(expected);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed schema returns names and metadata", async function() {
                const func = (x, y) => x - y;
                const computation = {
                    name: "+2",
                    func: func.toString(),
                    input_type: "float",
                    return_type: "float"
                };

                const table = perspective.table(data);

                const table2 = table.add_computed([
                    {
                        computation: computation,
                        column: "plus2",
                        type: "integer",
                        inputs: ["x"],
                        input_type: "integer",
                        func: func
                    }
                ]);

                const result = await table2.computed_schema();
                const expected = {
                    plus2: {
                        input_columns: ["x"],
                        input_type: "integer",
                        computation: computation,
                        type: "integer"
                    }
                };

                expect(result).toEqual(expected);
                table2.delete();
                table.delete();
            });
        });

        describe("row pivots", function() {
            it("should update on dependent columns", async function() {
                const table = perspective
                    .table([
                        {int: 1, float: 2.25, string: "a", datetime: new Date()},
                        {int: 2, float: 3.5, string: "b", datetime: new Date()},
                        {int: 3, float: 4.75, string: "c", datetime: new Date()},
                        {int: 4, float: 5.25, string: "d", datetime: new Date()}
                    ])
                    .add_computed([
                        {
                            column: "int+float",
                            type: "float",
                            func: (w, x) => w + x,
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({
                    row_pivots: ["int+float"]
                });

                table.update([{int: 4, __INDEX__: 0}]);

                let json = await view.to_json({
                    index: true
                });

                expect(json).toEqual([
                    {__ROW_PATH__: [], int: 13, "int+float": 28.75, float: 15.75, string: 4, datetime: 4, __INDEX__: [0, 3, 2, 1]},
                    {__ROW_PATH__: [5.5], int: 2, "int+float": 5.5, float: 3.5, string: 1, datetime: 1, __INDEX__: [1]},
                    {__ROW_PATH__: [6.25], int: 4, "int+float": 6.25, float: 2.25, string: 1, datetime: 1, __INDEX__: [0]},
                    {__ROW_PATH__: [7.75], int: 3, "int+float": 7.75, float: 4.75, string: 1, datetime: 1, __INDEX__: [2]},
                    {__ROW_PATH__: [9.25], int: 4, "int+float": 9.25, float: 5.25, string: 1, datetime: 1, __INDEX__: [3]}
                ]);
            });

            it("should update on dependent columns, add", async function() {
                const table = perspective
                    .table([
                        {int: 1, float: 2.25, string: "a", datetime: new Date()},
                        {int: 2, float: 3.5, string: "b", datetime: new Date()},
                        {int: 3, float: 4.75, string: "c", datetime: new Date()},
                        {int: 4, float: 5.25, string: "d", datetime: new Date()}
                    ])
                    .add_computed([
                        {
                            column: "int+float",
                            func_name: "+",
                            type: "float",
                            func: (w, x) => w + x,
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({
                    row_pivots: ["int+float"]
                });

                table.update([{int: 4, __INDEX__: 0}]);

                let json = await view.to_json({
                    index: true
                });

                expect(json).toEqual([
                    {__ROW_PATH__: [], int: 13, "int+float": 28.75, float: 15.75, string: 4, datetime: 4, __INDEX__: [0, 3, 2, 1]},
                    {__ROW_PATH__: [5.5], int: 2, "int+float": 5.5, float: 3.5, string: 1, datetime: 1, __INDEX__: [1]},
                    {__ROW_PATH__: [6.25], int: 4, "int+float": 6.25, float: 2.25, string: 1, datetime: 1, __INDEX__: [0]},
                    {__ROW_PATH__: [7.75], int: 3, "int+float": 7.75, float: 4.75, string: 1, datetime: 1, __INDEX__: [2]},
                    {__ROW_PATH__: [9.25], int: 4, "int+float": 9.25, float: 5.25, string: 1, datetime: 1, __INDEX__: [3]}
                ]);
            });
        });
    });
};
