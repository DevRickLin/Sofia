import { Color, ColorPattern } from "./type";
import { ColorMap } from "./constant";

export const getColor = (color: Color): ColorPattern => {
    return ColorMap[color] || ColorMap["gray"];
};
