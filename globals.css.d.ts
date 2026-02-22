// custom.d.ts or globals.css.d.ts in your project root
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
