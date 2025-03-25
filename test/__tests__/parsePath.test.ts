import parsePath from '../../src/utils/parsePath';

describe('path parse test', () => {
  const r_1 = JSON.stringify(['a', 'b', 'c']);
  const path_1_1 = '/a/b/c';
  test(path_1_1, () => {
    const result = parsePath.simplifyPath(path_1_1);
    expect(JSON.stringify(result.pathArr)).toBe(r_1);
  });
  const path_1_2 = 'a/b/c';
  test(path_1_2, () => {
    const result = parsePath.simplifyPath(path_1_2);
    expect(JSON.stringify(result.pathArr)).toBe(r_1);
  });
  const path_1_3 = './a/b/c';
  test(path_1_3, () => {
    const result = parsePath.simplifyPath(path_1_3);
    expect(JSON.stringify(result.pathArr)).toBe(r_1);
  });
  const path_1_4 = './a/b/./c';
  test(path_1_4, () => {
    const result = parsePath.simplifyPath(path_1_4);
    expect(JSON.stringify(result.pathArr)).toBe(r_1);
  });

  const r_2 = JSON.stringify(['a', 'b']);
  const path_2_1 = '/a/b/c/..';
  test(path_2_1, () => {
    const result = parsePath.simplifyPath(path_2_1);
    expect(JSON.stringify(result.pathArr)).toBe(r_2);
  });
  const path_2_2 = 'a/b/c/..';
  test(path_2_2, () => {
    const result = parsePath.simplifyPath(path_2_2);
    expect(JSON.stringify(result.pathArr)).toBe(r_2);
  });
  const path_2_3 = './a/b/c/..';
  test(path_2_3, () => {
    const result = parsePath.simplifyPath(path_2_3);
    expect(JSON.stringify(result.pathArr)).toBe(r_2);
  });
  const path_2_4 = './a/./b/c/..';
  test(path_2_4, () => {
    const result = parsePath.simplifyPath(path_2_4);
    expect(JSON.stringify(result.pathArr)).toBe(r_2);
  });

  const r_3 = JSON.stringify(['a']);
  test('/a/b/c/../..', () => {
    const result = parsePath.simplifyPath('/a/b/c/../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_3);
  });
  test('a/b/c/../..', () => {
    const result = parsePath.simplifyPath('a/b/c/../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_3);
  });
  test('./a/b/c/../..', () => {
    const result = parsePath.simplifyPath('./a/b/c/../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_3);
  });
  test('./a/b/./c/../..', () => {
    const result = parsePath.simplifyPath('./a/b/./c/../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_3);
  });

  const r_4 = JSON.stringify([]);
  test('/a/b/c/../../..', () => {
    const result = parsePath.simplifyPath('/a/b/c/../../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_4);
  });
  test('a/b/c/../../..', () => {
    const result = parsePath.simplifyPath('a/b/c/../../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_4);
  });
  test('./a/b/c/../../..', () => {
    const result = parsePath.simplifyPath('./a/b/c/../../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_4);
  });
  test('./a/b/c/./../../..', () => {
    const result = parsePath.simplifyPath('./a/b/c/./../../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_4);
  });

  const r_5 = JSON.stringify(['a']);
  test('/a/b/c/../../../a', () => {
    const result = parsePath.simplifyPath('/a/b/c/../../../a');
    expect(JSON.stringify(result.pathArr)).toBe(r_5);
  });
  test('a/b/c/../../../a', () => {
    const result = parsePath.simplifyPath('a/b/c/../../../a');
    expect(JSON.stringify(result.pathArr)).toBe(r_5);
  });
  test('./a/b/c/../../../a', () => {
    const result = parsePath.simplifyPath('./a/b/c/../../../a');
    expect(JSON.stringify(result.pathArr)).toBe(r_5);
  });
  test('./a/b/c/.././../../a', () => {
    const result = parsePath.simplifyPath('./a/b/c/.././../../a');
    expect(JSON.stringify(result.pathArr)).toBe(r_5);
  });

  const r_6 = JSON.stringify(['d']);
  test('/a/b/c/../../../d', () => {
    const result = parsePath.simplifyPath('/a/b/c/../../../d');
    expect(JSON.stringify(result.pathArr)).toBe(r_6);
  });
  test('a/b/c/../../../d', () => {
    const result = parsePath.simplifyPath('a/b/c/../../../d');
    expect(JSON.stringify(result.pathArr)).toBe(r_6);
  });
  test('./a/b/c/../../../d', () => {
    const result = parsePath.simplifyPath('./a/b/c/../../../d');
    expect(JSON.stringify(result.pathArr)).toBe(r_6);
  });
  test('./a/b/c/../.././../d', () => {
    const result = parsePath.simplifyPath('./a/b/c/../.././../d');
    expect(JSON.stringify(result.pathArr)).toBe(r_6);
  });

  const r_7 = JSON.stringify([]);
  test('/a/b/c/../../../..', () => {
    const result = parsePath.simplifyPath('/a/b/c/../../../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_7);
  });
  test('a/b/c/../../../..', () => {
    const result = parsePath.simplifyPath('a/b/c/../../../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_7);
  });
  test('./a/b/c/../../../..', () => {
    const result = parsePath.simplifyPath('./a/b/c/../../../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_7);
  });
  test('./a/b/c/../../../../.', () => {
    const result = parsePath.simplifyPath('./a/b/c/../../../../.');
    expect(JSON.stringify(result.pathArr)).toBe(r_7);
  });

  const r_8 = JSON.stringify(['e']);
  test('/a/b/c/../../../../e', () => {
    const result = parsePath.simplifyPath('/a/b/c/../../../../e');
    expect(JSON.stringify(result.pathArr)).toBe(r_8);
  });
  test('a/b/c/../../../../e', () => {
    const result = parsePath.simplifyPath('a/b/c/../../../../e');
    expect(JSON.stringify(result.pathArr)).toBe(r_8);
  });
  test('./a/b/c/../../../../e', () => {
    const result = parsePath.simplifyPath('./a/b/c/../../../../e');
    expect(JSON.stringify(result.pathArr)).toBe(r_8);
  });
  test('./a/b/c/../../../.././e', () => {
    const result = parsePath.simplifyPath('./a/b/c/../../../.././e');
    expect(JSON.stringify(result.pathArr)).toBe(r_8);
  });

  const r_9 = JSON.stringify(['a']);
  test('/../../a', () => {
    const result = parsePath.simplifyPath('/../../a');
    expect(JSON.stringify(result.pathArr)).toBe(r_9);
  });
  test('../../a', () => {
    const result = parsePath.simplifyPath('../../a');
    expect(JSON.stringify(result.pathArr)).toBe(r_9);
  });
  test('./../../a', () => {
    const result = parsePath.simplifyPath('./../../a');
    expect(JSON.stringify(result.pathArr)).toBe(r_9);
  });
  test('./.././../a', () => {
    const result = parsePath.simplifyPath('./.././../a');
    expect(JSON.stringify(result.pathArr)).toBe(r_9);
  });

  const r_10 = JSON.stringify(['b']);
  test('/../../a/b', () => {
    const result = parsePath.simplifyPath('/../../a/b');
    expect(JSON.stringify(result.pathArr)).toBe(r_10);
  });
  test('../../a/b', () => {
    const result = parsePath.simplifyPath('../../a/b');
    expect(JSON.stringify(result.pathArr)).toBe(r_10);
  });
  test('./../../a/b', () => {
    const result = parsePath.simplifyPath('./../../a/b');
    expect(JSON.stringify(result.pathArr)).toBe(r_10);
  });
  test('./../../a/./b', () => {
    const result = parsePath.simplifyPath('./../../a/./b');
    expect(JSON.stringify(result.pathArr)).toBe(r_10);
  });

  const r_11 = JSON.stringify(['a']);
  test('/../../a/b/..', () => {
    const result = parsePath.simplifyPath('/../../a/b/..');
    expect(JSON.stringify(result.pathArr)).toBe(r_11);
  });
  test('../../a/b/..', () => {
    const result = parsePath.simplifyPath('../../a/b/..');
    expect(JSON.stringify(result.pathArr)).toBe(r_11);
  });
  test('./../../a/b/..', () => {
    const result = parsePath.simplifyPath('./../../a/b/..');
    expect(JSON.stringify(result.pathArr)).toBe(r_11);
  });
  test('./../../a/b/./..', () => {
    const result = parsePath.simplifyPath('./../../a/b/./..');
    expect(JSON.stringify(result.pathArr)).toBe(r_11);
  });

  const r_12 = JSON.stringify(['d']);
  test('/../../a/b/../d', () => {
    const result = parsePath.simplifyPath('/../../a/b/../d');
    expect(JSON.stringify(result.pathArr)).toBe(r_12);
  });
  test('../../a/b/../d', () => {
    const result = parsePath.simplifyPath('../../a/b/../d');
    expect(JSON.stringify(result.pathArr)).toBe(r_12);
  });
  test('./../../a/b/../d', () => {
    const result = parsePath.simplifyPath('./../../a/b/../d');
    expect(JSON.stringify(result.pathArr)).toBe(r_12);
  });
  test('./../../a/b/./../d', () => {
    const result = parsePath.simplifyPath('./../../a/b/./../d');
    expect(JSON.stringify(result.pathArr)).toBe(r_12);
  });

  const r_13 = JSON.stringify([]);
  test('/../../a/b/../..', () => {
    const result = parsePath.simplifyPath('/../../a/b/../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_13);
  });
  test('../../a/b/../..', () => {
    const result = parsePath.simplifyPath('../../a/b/../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_13);
  });
  test('./../../a/b/../..', () => {
    const result = parsePath.simplifyPath('./../../a/b/../..');
    expect(JSON.stringify(result.pathArr)).toBe(r_13);
  });
  test('./../../a/b/../../.', () => {
    const result = parsePath.simplifyPath('./../../a/b/../../.');
    expect(JSON.stringify(result.pathArr)).toBe(r_13);
  });
});

describe('relativePath', () => {
  test('a', () => {
    expect(parsePath.relativePath('a')).toBe(true);
  });
  test('./a', () => {
    expect(parsePath.relativePath('./a')).toBe(true);
  });
  test('../a', () => {
    expect(parsePath.relativePath('../a')).toBe(true);
  });
});
