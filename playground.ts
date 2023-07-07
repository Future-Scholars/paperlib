let a = { kye1: 2 };

console.log(a);

function modify(obj: any) {
  obj.kye1 = 3;
  throw new Error("error");

  return obj;
}

try {
  a = modify(a);
} catch (e) {
  console.log(e);
}

console.log(a);
