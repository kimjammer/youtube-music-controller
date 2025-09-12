import {DidReceiveSettingsEvent, WillAppearEvent, WillDisappearEvent} from "@elgato/streamdeck";

interface Instance {
	ev: WillAppearEvent<any>;
}

export function findInstance(instances: Instance[], ev: WillAppearEvent<any> | WillDisappearEvent<any> | DidReceiveSettingsEvent<any>){
	//Assert we are not in multi action
	if (ev.payload.isInMultiAction) return;

	//Find coordinates
	let col = ev.payload.coordinates.column;
	let row = ev.payload.coordinates.row;

	//Find instance
	return instances.find((instance) => {
		return !instance.ev.payload.isInMultiAction &&
			instance.ev.payload.coordinates.column === col &&
			instance.ev.payload.coordinates.row === row;
	})
}

export function findInstanceIndex(instances: Instance[], ev: WillAppearEvent<any> | WillDisappearEvent<any> | DidReceiveSettingsEvent<any>){
	//Assert we are not in multi action
	if (ev.payload.isInMultiAction) return;

	//Find coordinates
	let col = ev.payload.coordinates.column;
	let row = ev.payload.coordinates.row;

	//Find instance
	return instances.findIndex((instance) => {
		return !instance.ev.payload.isInMultiAction &&
			instance.ev.payload.coordinates.column === col &&
			instance.ev.payload.coordinates.row === row;
	})
}