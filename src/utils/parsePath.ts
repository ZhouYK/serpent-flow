/**
 * 在Linux系统中，文件路径遵循一定的规则。路径可以分为绝对路径和相对路径。以下是一些常见的规则和示例：
 *
 * 绝对路径： 从根目录(/)开始的路径。
 * 示例：/home/user/documents/file.txt
 * 相对路径： 相对于当前工作目录的路径。
 * 示例：如果当前工作目录是/home/user，则相对路径documents/file.txt将指向/home/user/documents/file.txt。
 * 目录分隔符： 目录之间的分隔符是斜杠(/)。
 * 示例：/home/user/documents
 * 特殊目录：
 * .：表示当前目录。
 * 示例：./file.txt
 * ..：表示父目录。
 * 示例：../documents/file.txt
 * 家目录： 用户的主目录通常用波浪号(~)表示。
 * 示例：~/documents/file.txt
 * 环境变量： 使用环境变量时，可以通过$符号引用。
 * 示例：$HOME/documents/file.txt
 * 空格处理： 如果路径中包含空格或特殊字符，可以使用引号将整个路径括起来，以避免解释器误解。
 * 示例："/path/with spaces/file.txt"
 * 文件名区分大小写： Linux系统是区分大小写的，因此File.txt和file.txt是不同的文件。
 * 这些规则构成了Linux文件路径的基本元素。了解这些规则对于在Linux系统中导航和操作文件系统非常重要。
 */
import type { FNode } from '../interface';

interface PathItem {
  index: number;
  name?: string;
  reserve?: boolean;
}
class ParsePath {
  // tilde = '~';

  dot = '.';

  dDots = '..';

  slash = '/';

  // homeStartStr = `${this.tilde}${this.slash}`;

  parentStartStr = `${this.dDots}${this.slash}`;

  currentStartStr = `${this.dot}${this.slash}`;

  absolutPath = (path: string) => {
    return this.rootStart(path);
  };

  relativePath = (path: string) => {
    return this.currentStart(path) || this.parentStart(path);
  };

  home = (path: string) => {
    return path === this.slash;
  };

  parent = (path: string) => {
    return path === this.dDots;
  };

  current = (path: string) => {
    return path === this.dot;
  };

  rootStart = (path: string) => {
    return path?.startsWith(this.slash);
  };
  //
  // homeStart = (path: string) => {
  //   return path?.startsWith(this.homeStartStr);
  // }

  parentStart = (path: string) => {
    return path?.startsWith(this.parentStartStr);
  };

  currentStart = (path: string) => {
    return (
      path?.startsWith(this.currentStartStr)
      || !(this.parentStart(path) || this.rootStart(path))
    );
  };

  split = (path: string) => {
    // /**
    //  * a/b 这种路径相对路径会被转化成 ./a/b
    //  */
    // if (this.currentStart(path) && !(path?.startsWith(this.currentStartStr))) {
    //   tmpPath = `${this.currentStartStr}${path}`;
    // }

    const result = path?.split(this.slash) || [];
    const l = result?.length;
    const first = result[0];
    const last = result[l - 1];
    // 首尾的空串和 '.' 对于路径没有用（既不涉及转换上下文，也不涉及路径查找，而且存在的话会造成错误），需要去掉
    if (first === '' || first === this.dot) {
      result.shift();
    }
    if (last === '' || last === this.dot) {
      result.pop();
    }

    // 空字符串元素需要过滤掉
    return result;
  };

  /**
   * 判断 str 是否是名字
   * @param str
   */
  notName = (str: string) => {
    return [this.dot, this.dDots].includes(str);
  };

  /**
   * 对路径做简化处理，目的是找到最短路径（最短是指路径字符最短，并不是真实寻找路径的最短）
   * 记录每一个节点的深度，其中 context 节点深度为 0，向上寻找的点深度 -1，向下寻找的点深度 +1
   * 如果出现了两个点的深度一致，则这两点需要合并。如果这两点之间还存在着其他点，那么这些点都会被省略。
   * 合并的规则是：（为了描述方便，前一个点称为 A，后一个点称为 B）
   * 除了保留字符 . 以及 .. 以及 / ，其他的字符都是名字（将来保留字符应该会增加）
   * 1. B 点如果有名字，A 点为 .. 则不能覆盖，A 为其他情况都可以覆盖；
   * 2. B 点如果没有名字而 A 点有，则 保留 A 点的名字覆盖 B 点的；
   * 3. 如果都没有名字，则保留 B 点字符覆盖 A 点的字符。
   * @param path
   * @param context
   */
  simplifyPath = (path: string, context?: FNode) => {
    const pathArr = this.split(path);
    let l = pathArr.length;
    const start = 0;
    const recordPathByDepth: Map<number, PathItem> = new Map();
    let depth = 0;

    for (let i = start; i < l; i += 1) {
      const name = pathArr[i];
      let parent = false;
      let child = false;
      if (this.current(name)) {
        depth += 0;
      } else if (this.parent(name)) {
        depth -= 1;
        parent = true;
      } else {
        depth += 1;
        child = true;
      }
      const targetPrev = recordPathByDepth.get(depth);
      const currentNotName = this.notName(name);
      const prevNotName = this.notName(targetPrev?.name);
      const prevParentName = this.parent(targetPrev?.name);
      // 前面没有路径深度相同的点
      // 或者 当前路径有名字，之前的点为 ..
      if (!targetPrev || (!currentNotName && prevParentName)) {
        recordPathByDepth.set(depth, {
          index: i,
          name,
        });
        continue;
      }
      let startIndex = targetPrev.index;
      const deleteCount = i - targetPrev.index;
      // 当前路径没有名字
      if (currentNotName) {
        // 之前的路径也没有
        if (prevNotName) {
          // 保留当前，覆盖之前
          targetPrev.name = name;
        } else {
          // 保留之前，覆盖当前
          startIndex = targetPrev.index + 1;
        }
      } else {
        // 保留当前，覆盖之前
        targetPrev.name = name;
      }

      // deleteCount 只会是 1 或者 2
      // 为 1 表明是相邻的点深度一致
      // 为 2 表明中间隔了一个点，隔了一个点的情况需要把该点删除掉
      if (deleteCount === 2) {
        // 当前节点是从 depth -= 1 来的，前一个点则应该 + 1
        let tmp;
        if (parent) {
          tmp = depth + 1;
        } else if (child) {
          tmp = depth - 1;
        }
        recordPathByDepth.delete(tmp);
      }

      pathArr.splice(startIndex, deleteCount);
      l -= deleteCount;
      i = targetPrev.index;
    }
    let newContext = context;
    // 深度为 0 的点回归到 context，需要将其以及之前的元素都删掉
    if (recordPathByDepth.has(0)) {
      const zeroTarget = recordPathByDepth.get(0);
      let deleteCount = zeroTarget.index + 1;
      // 如果深度为 0 的点有名字，则需要切换上下文节点
      if (!this.notName(zeroTarget.name)) {
        newContext = context?.parent;
        deleteCount -= 1;
      }
      pathArr.splice(0, deleteCount);
    }
    // 其他情况，只有开始全部是 .. 的需要转换 context，比如 ../../../a
    // 判断 pathArr 的元素是 ..，直到遇到非 .. 的元素就中止
    const tmpL = pathArr.length;
    let arrIndex = 0;
    for (; arrIndex < tmpL; arrIndex += 1) {
      const tmpItem = pathArr[arrIndex];
      if (!this.parent(tmpItem)) {
        break;
      }
      newContext = context?.parent;
    }
    if (arrIndex) {
      pathArr.splice(0, arrIndex);
    }

    // 去掉 pathArr 中的空字符串，空字符串来自于 split
    // pathArr 一定是以名字开头，但可能为空数组
    // 所有的查找路径最终都会被转换成 context + a/b/c 这种查询组合
    return {
      pathArr,
      newContext,
    };
  };
}

export default new ParsePath();
