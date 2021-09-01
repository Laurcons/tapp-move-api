
export type DecimalDegreesLocation = [number, number];
export type DecimalMinutesLocation = [[number, number], [number, number]];

export function decimalDegreesToDecimalMinutes(
	from: DecimalDegreesLocation
): DecimalMinutesLocation {
	const [lonDec, latDec] = from;
	const lonDeg = Math.floor(lonDec);
	const latDeg = Math.floor(latDec);
	const lonMin = 60 * (lonDec - lonDeg);
	const latMin = 60 * (latDec - latDeg);
	return [
		[lonDeg, lonMin],
		[latDeg, latMin],
	];
}

export function decimalMinutesToDecimalDegrees(from: DecimalMinutesLocation): DecimalDegreesLocation {
    return [
        from[0][0] + (from[0][1] / 60),
        from[1][0] + (from[1][1] / 60),
    ];
}