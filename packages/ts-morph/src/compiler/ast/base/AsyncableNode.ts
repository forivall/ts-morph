import { errors, SyntaxKind, ts } from "@ts-morph/common";
import { AsyncableNodeStructure } from "../../../structures";
import { Constructor } from "../../../types";
import { callBaseGetStructure } from "../callBaseGetStructure";
import { callBaseSet } from "../callBaseSet";
import { Node } from "../common";
import { ModifierableNode } from "./ModifierableNode";

export type AsyncableNodeExtensionType = Node & ModifierableNode;

export interface AsyncableNode {
  /**
   * If it's async.
   */
  isAsync(): boolean;
  /**
   * Gets the async keyword or undefined if none exists.
   */
  getAsyncKeyword(): Node<ts.AsyncKeyword> | undefined;
  /**
   * Gets the async keyword or throws if none exists.
   */
  getAsyncKeywordOrThrow(): Node<ts.AsyncKeyword>;
  /**
   * Sets if the node is async.
   * @param value - If it should be async or not.
   */
  setIsAsync(value: boolean): this;
}

export function AsyncableNode<T extends Constructor<AsyncableNodeExtensionType>>(Base: T): Constructor<AsyncableNode> & T {
  return class extends Base implements AsyncableNode {
    isAsync() {
      return this.hasModifier(SyntaxKind.AsyncKeyword);
    }

    getAsyncKeyword(): Node<ts.AsyncKeyword> | undefined {
      return this.getFirstModifierByKind(SyntaxKind.AsyncKeyword) as Node<ts.AsyncKeyword> | undefined;
    }

    getAsyncKeywordOrThrow(): Node<ts.AsyncKeyword> {
      return errors.throwIfNullOrUndefined(this.getAsyncKeyword(), "Expected to find an async keyword.");
    }

    setIsAsync(value: boolean) {
      this.toggleModifier("async", value);
      return this;
    }

    set(structure: Partial<AsyncableNodeStructure>) {
      callBaseSet(Base.prototype, this, structure);

      if (structure.isAsync != null)
        this.setIsAsync(structure.isAsync);

      return this;
    }

    getStructure() {
      return callBaseGetStructure<AsyncableNodeStructure>(Base.prototype, this, {
        isAsync: this.isAsync(),
      });
    }
  };
}
