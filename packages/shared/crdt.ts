// Lifted from Automerge and converted to TypeScript:
// https://josephg.com/blog/crdts-are-the-future/
// https://github.com/automerge/automerge/blob/performance/test/fuzz_test.js

import * as assert from 'assert';

const ROOT_ID = '_root';

/**
 * Miniature implementation of a subset of Automerge, which is used below as definition of the
 * expected behaviour during fuzz testing. Supports the following:
 *  - only map, list, and primitive datatypes (no table, text, counter, or date objects)
 *  - no undo/redo
 *  - no conflicts on concurrent updates to the same field (uses last-writer-wins instead)
 *  - no API for creating new changes (you need to create change objects yourself)
 *  - no buffering of changes that are missing their causal dependencies
 *  - no saving or loading in serialised form
 *  - relies on object mutation (no immutability)
 */

type OpId = string

type Op = {
  action: 'makeMap' | 'makeList' | 'set' | 'del',
  obj: OpId,
  key: string,
  insert: boolean,
  value?: unknown,
}

type Change = {
  actor: string,
  seq: number,
  deps: {
    [actorId: string]: number // Last seen seq from an actor
  },
  startOp: number,
  ops: Op[],
}

type ObjMap = { [key in string]: unknown }
type ObjList = Array<unknown>

type MetaMap = { [key in string]: string }
type MetaList = Array<{ elemId: OpId, valueId: OpId, deleted: boolean }>

function MicroCRDT() {
  // Map from actorId to array of changes
  const byActor: {
    [actorId in string]?: Change[]
  } = {};
  // Objects, keyed by the ID of the operation that created the object
  const byObjId: {
    [oid in OpId]?: ObjMap | ObjList
  } = {
    [ROOT_ID]: {},
  };
  // Map from objID to object metadata for each object field (index or key)
  const metadata: {
    [oid in OpId]?: MetaMap | MetaList
  } = {
    [ROOT_ID]: {},
  };

  /**
   * Updates the document state by applying the change object `change`, in the format documented here:
   * https://github.com/automerge/automerge/blob/performance/BINARY_FORMAT.md#json-representation-of-changes
   */
  const applyChange = (change: Change) => {
    // Check that the change's dependencies are met
    const lastSeq = byActor[change.actor]
      ? byActor[change.actor]!.length
      : 0;
    if (change.seq !== lastSeq + 1) {
      throw new RangeError(`Expected sequence number ${lastSeq + 1}, got ${change.seq}`);
    }
    // TODO: I don't actually use this?
    // How do I produce a dependency and for what reason would I want to do
    // that... Is it possible that in Etch there are no deps?
    for (const [actor, dep] of Object.entries(change.deps)) {
      if (!byActor[actor] || byActor[actor]!.length < dep) {
        throw new RangeError(`Missing dependency: change ${dep} by actor ${actor}`);
      }
    }

    if (!byActor[change.actor]) byActor[change.actor] = [];
    byActor[change.actor]!.push(change);

    change.ops.forEach((op, index) => {
      applyOp(Object.assign({ opId: `${change.startOp + index}@${change.actor}` }, op));
    });
  };

  /**
   * Updates the document state with one of the operations from a change.
   */
  const applyOp = (op: Op & { opId: string }) => {
    if (!metadata[op.obj] || !byObjId[op.obj]) {
      throw new RangeError(`Object does not exist: ${op.obj}`);
    }
    switch (op.action) {
      case 'makeList':
        byObjId[op.opId] = [];
        metadata[op.opId] = [];
        break;
      case 'makeMap':
        byObjId[op.opId] = [];
        metadata[op.opId] = [];
        break;
      case 'set':
      case 'del':
        break;
      default:
        throw new RangeError(`Unsupported operation type: ${op.action as string}`);
    }

    // as List
    if (Array.isArray(metadata[op.obj])) {
      if (op.insert)
        applyListInsert(op);
      else
        applyListUpdate(op);
      return;
    }

    // as Map
    const metaObj = metadata[op.obj] as MetaMap;
    const obj = byObjId[op.obj] as ObjMap;
    if (!metaObj[op.key] || compareOpIds(metaObj[op.key], op.opId)) {
      metaObj[op.key] = op.opId;
      if (op.action === 'del') {
        delete obj[op.key];
      } else if (op.action.startsWith('make')) {
        obj[op.key] = byObjId[op.opId];
      } else {
        obj[op.key] = op.value;
      }
    }
  };

  /**
   * Applies a list insertion operation.
   */
  const applyListInsert = (op: Op & { opId: string }) => {
    const meta = metadata[op.obj] as MetaList | undefined;
    const obj = byObjId[op.obj] as ObjList | undefined;
    if (!meta || !obj) {
      throw new RangeError(`Object does not exist: ${op.obj}`);
    }
    const value = op.action.startsWith('make')
      ? byObjId[op.opId]
      : op.value;
    let { index, visible } = (op.key === '_head')
      ? { index: -1, visible: 0 }
      : findListElement(op.obj, op.key);
    if (index >= 0 && !meta[index].deleted) {
      visible++;
    }
    index++;
    while (index < meta.length && compareOpIds(op.opId, meta[index].elemId)) {
      if (!meta[index].deleted) visible++;
      index++;
    }
    meta.splice(index, 0, { elemId: op.opId, valueId: op.opId, deleted: false });
    obj.splice(visible, 0, value);
  };

  /**
   * Applies a list element update (setting the value of a list element, or deleting a list element).
   */
  const applyListUpdate = (op: Op & { opId: string }) => {
    const { index, visible } = findListElement(op.obj, op.key);
    const meta = metadata[op.obj] as MetaList | undefined;
    const obj = byObjId[op.obj] as ObjList | undefined;
    if (!meta || !obj) {
      throw new RangeError(`Object does not exist: ${op.obj}`);
    }
    const metaItem = meta[index];
    if (op.action === 'del') {
      if (!metaItem.deleted) {
        obj.splice(visible, 1);
      }
      metaItem.deleted = true;
    } else if (compareOpIds(metaItem.valueId, op.opId)) {
      if (!metaItem.deleted) {
        obj[visible] = op.action.startsWith('make')
          ? byObjId[op.opId]
          : op.value;
      }
      metaItem.valueId = op.opId;
    }
  };

  /**
   * Searches for the list element with ID `elemId` in the object with ID `objId`. Returns an object
   * `{index, visible}` where `index` is the index of the element in the metadata array, and
   * `visible` is the number of non-deleted elements that precede the specified element.
   */
  const findListElement = (objectId: string, elemId: string) => {
    let index = 0;
    let visible = 0;
    const meta = metadata[objectId] as MetaList | undefined;
    if (!meta) {
      throw new RangeError(`Meta object does not exist: ${objectId}`);
    }
    while (index < meta.length && meta[index].elemId !== elemId) {
      if (!meta[index].deleted) visible++;
      index++;
    }
    if (index === meta.length) {
      throw new RangeError(`List element not found: ${objectId}, ${elemId}`);
    }
    return { index, visible };
  };

  /**
   * Compares two operation IDs in the form `counter@actor`. Returns true if `id1` has a lower counter
   * than `id2`, or if the counter values are the same and `id1` has an actorId that sorts
   * lexicographically before the actorId of `id2`.
   */
  const compareOpIds = (id1: string, id2: string) => {
    const regex = /^([0-9]+)@(.*)$/;
    const match1 = regex.exec(id1);
    const match2 = regex.exec(id2);
    if (!match1 || !match2) {
      throw new Error(`No match for counter@actor: ${id1}, ${id2}`);
    }
    const counter1 = parseInt(match1[1]);
    const counter2 = parseInt(match2[1]);
    return (counter1 < counter2) || (counter1 === counter2 && match1[2] < match2[2]);
  };

  return {
    root: byObjId[ROOT_ID],
    applyChange,
    applyOp,
    applyListInsert,
    applyListUpdate,
  };
}

/********** TESTS *************/

const change1: Change = { actor: '1234', seq: 1, deps: {}, startOp: 1, ops: [
  { action: 'set', obj: ROOT_ID, key: 'title', insert: false, value: 'Hello' },   // opId: 1 via startOp
  { action: 'makeList', obj: ROOT_ID, key: 'tags', insert: false },               // opId: 2
  { action: 'set', obj: '2@1234', key: '_head', insert: true, value: 'foo' },     // opId: 3
] };

const change2: Change = { actor: '1234', seq: 2, deps: {}, startOp: 4, ops: [
  { action: 'set', obj: ROOT_ID, key: 'title', insert: false, value: 'Hello 1' }, // opId: 4 via startOp
  { action: 'set', obj: '2@1234', key: '3@1234', insert: true, value: 'bar' },    // opId: 5
  { action: 'del', obj: '2@1234', key: '3@1234', insert: false },                 // opId: 6
] };

const change3: Change = { actor: 'abcd', seq: 1, deps: { 1234: 1 }, startOp: 4, ops: [
  { action: 'set', obj: ROOT_ID, key: 'title', insert: false, value: 'Hello 2' }, // opId: 4 via startOp
  { action: 'set', obj: '2@1234', key: '3@1234', insert: true, value: 'baz' },    // opId: 5
] };

// Change 2 and 3 happen by different people in conflict

const doc1 = MicroCRDT();
const doc2 = MicroCRDT();
for (const c of [change1, change2, change3]) doc1.applyChange(c);
for (const c of [change1, change3, change2]) doc2.applyChange(c);
assert.deepStrictEqual(doc1.root, { title: 'Hello 2', tags: ['baz', 'bar'] });
assert.deepStrictEqual(doc2.root, { title: 'Hello 2', tags: ['baz', 'bar'] });

const change4: Change = { actor: '2345', seq: 1, deps: {}, startOp: 1, ops: [
  { action: 'makeList', obj: ROOT_ID, key: 'todos', insert: false },
  { action: 'set', obj: '1@2345', key: '_head', insert: true, value: 'Task 1' },
  { action: 'set', obj: '1@2345', key: '2@2345', insert: true, value: 'Task 2' },
] };

const doc3 = MicroCRDT();
doc3.applyChange(change4);
assert.deepStrictEqual(doc3.root, { todos: ['Task 1', 'Task 2'] });

const change5: Change = { actor: '2345', seq: 2, deps: {}, startOp: 4, ops: [
  { action: 'del', obj: '1@2345', key: '2@2345', insert: false },
  { action: 'set', obj: '1@2345', key: '3@2345', insert: true, value: 'Task 3' },
] };
doc3.applyChange(change5);
assert.deepStrictEqual(doc3.root, { todos: ['Task 2', 'Task 3'] });

const change6: Change = { actor: '2345', seq: 3, deps: {}, startOp: 6, ops: [
  { action: 'del', obj: '1@2345', key: '3@2345', insert: false },
  { action: 'set', obj: '1@2345', key: '5@2345', insert: false, value: 'Task 3b' },
  { action: 'set', obj: '1@2345', key: '5@2345', insert: true, value: 'Task 4' },
] };
doc3.applyChange(change6);
assert.deepStrictEqual(doc3.root, { todos: ['Task 3b', 'Task 4'] });

console.log('OK');
