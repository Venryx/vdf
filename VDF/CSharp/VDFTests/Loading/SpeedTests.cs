﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using FluentAssertions;
using VDFN;
using Xunit;

namespace VDFTests {
	public class Loading_SpeedTests {
		static Loading_SpeedTests() {
			VDFLoader.ToVDFNode("false");
			D5_SpeedTester();
			D5_SpeedTester2();
		}

		[Fact] static void D5_SpeedTester() {
			var vdf = @"{id:'595880cd-13cd-4578-9ef1-bd3175ac72bb' visible:true parts:[^] tasksScriptText:'<<Grab Flag
	(Crate ensure contains an EnemyFlag) ensure is false
	targetFlag be EnemyFlag_OnEnemyGround [objectRefreshInterval: infinity] [lifetime: infinity]
	targetFlag set tag 'taken'
	FrontLeftWheel turn to targetFlag [with: FrontRightWheel]
	FrontLeftWheel roll forward
	FrontRightWheel roll forward
	BackLeftWheel roll forward
	BackRightWheel roll forward
	targetFlag put into Crate

Bring Flag to Safer Allied Ground
	Crate ensure contains an EnemyFlag
	targetLocation be AlliedGround_NoEnemyFlag_Safest [objectRefreshInterval: infinity]
	targetLocation set tag 'taken'
	FrontLeftWheel turn to targetLocation [with: FrontRightWheel]
	FrontLeftWheel roll forward
	FrontRightWheel roll forward
	BackLeftWheel roll forward
	BackRightWheel roll forward
	targetFlag put at targetLocation

Shoot at Enemy Vehicle
	Gun1 aim at EnemyVehicle_NonBroken
	Gun1 fire>>'}
	{id:'ba991aaf-447a-4a03-ade8-f4a11b4ea966' typeName:'Wood' name:'Body' pivotPoint_unit:'-0.1875,0.4375,-0.6875' anchorNormal:'0,1,0' scale:'0.5,0.25,1.5' controller:true}
	{id:'743f64f2-8ece-4dd3-bdf5-bbb6378ffce5' typeName:'Wood' name:'FrontBar' pivotPoint_unit:'-0.4375,0.5625,0.8125' anchorNormal:'0,0,1' scale:'1,0.25,0.25' controller:false}
	{id:'52854b70-c200-478f-bcd2-c69a03cd808f' typeName:'Wheel' name:'FrontLeftWheel' pivotPoint_unit:'-0.5,0.5,0.875' anchorNormal:'-1,0,0' scale:'1,1,1' controller:false}
	{id:'971e394c-b440-4fee-99fd-dceff732cd1e' typeName:'Wheel' name:'BackRightWheel' pivotPoint_unit:'0.5,0.5,-0.875' anchorNormal:'1,0,0' scale:'1,1,1' controller:false}
	{id:'77d30d72-9845-4b22-8e95-5ba6e29963b9' typeName:'Wheel' name:'FrontRightWheel' pivotPoint_unit:'0.5,0.5,0.875' anchorNormal:'1,0,0' scale:'1,1,1' controller:false}
	{id:'21ca2a80-6860-4de3-9894-b896ec77ef9e' typeName:'Wheel' name:'BackLeftWheel' pivotPoint_unit:'-0.5,0.5,-0.875' anchorNormal:'-1,0,0' scale:'1,1,1' controller:false}
	{id:'eea2623a-86d3-4368-b4e0-576956b3ef1d' typeName:'Wood' name:'BackBar' pivotPoint_unit:'-0.4375,0.4375,-0.8125' anchorNormal:'0,0,-1' scale:'1,0.25,0.25' controller:false}
	{id:'f1edc5a1-d544-4993-bdad-11167704a1e1' typeName:'MachineGun' name:'Gun1' pivotPoint_unit:'0,0.625,0.875' anchorNormal:'0,1,0' scale:'0.5,0.5,0.5' controller:false}
	{id:'e97f8ee1-320c-4aef-9343-3317accb015b' typeName:'Crate' name:'Crate' pivotPoint_unit:'0,0.625,0' anchorNormal:'0,1,0' scale:'0.5,0.5,0.5' controller:false}";
			VDFLoader.ToVDFNode(vdf);
		}
		[Fact] static void D5_SpeedTester2() {
			var vdf = @"{^}
	mainMenu:{}
	console:{^}
		jsCode:""<<//Log(BD.live.liveMatch.map.plants[0]._parent.toString())
//Log(new Vector3(1, 2, 3).Swapped());
//Log(ToVDF(BD.live.liveMatch.players[0].selectedObjects[0].GetPath()));
//Log(BD.live.liveMatch.units[0]._pathNode.toString());
//Log(BD.objects.objects[5].name)
//Log(BD.live.liveMatch.map.structures[1].typeVObject.type);
//Log(BD.objects.objects[4].structures.length)
//Log(BD.objects.objects[6].structures[1].name);

//Log(BD.objects.objects[0].overrideBounds_bounds.toString());
Log(BD.maps.maps[1].players.length)>>""
		logRunJSResult:false
		csCode:""<<//Debug.Log(BD.main.live.liveMatch.players[0].selectedObjects[0].health);
//Debug.Log(BD.main.objects.objects[0].type);
//Debug.Log(BD.main.maps.selectedMap.plants[0].wood);
//Debug.Log(BD.main.live.liveMatch.map.plants[0].type);

//Debug.Log(V.Vector3Null.Equals(V.Vector3Null));
//Debug.Log(VConvert.ToVDF(BD.main.live.liveMatch.players[0].selectedObjects[0].GetPath()));
//Debug.Log(BD.main.live.liveMatch.units[0]._pathNode);
//Debug.Log(BD.main.objects.objects[6].structures[1].name);
//Debug.Log(BD.main.objects.objects[0].overrideBounds_bounds.size.x);
//BD.main.live.liveMatch.players[0].waterSupply = 100;
Debug.Log(VInput.WebUIHasMouseFocus);>>""
		logRunCSResult:false
		callLoggerEnabled:false
		calls_maxEntries:500
		filterEnabled:false
		loggerEnabled:true
		logStackTrace:false
		capture_pathFinding:true
	settings:{^}
		showTooltips:true
		autoOpenPage:""
		resolutionWidth:0
		resolutionHeight:0
		resolutionRefreshRate:0
		fullscreen:false
		showFPS:true
		masterVolume:0
		dragVSMove_pan:true
		dragVSMove_rotate:false
		dragVSMove_rotate_around:true
		dragVSMove_zoom:false
		thirdPerson_panSpeed:1
		thirdPerson_minMoveToRotate:5
		thirdPerson_rotateSpeed:1
		thirdPerson_zoomSpeed:1
		edgeOfScreenScroll_enabled:false
		edgeOfScreenScroll_maxDistanceFromEdge:10
		edgeOfScreenScroll_scrollSpeed:1
		username:null
		showConsolePage:true
		developerHotkeys:true
		logStartupInfo:true
		logStartupTimes:true
		delayFileSystemDataLoad:false
		loadModels:true
		letOutpostProduceAnyUnit:true
		matchSpeedMultiplier_enabled:false
		matchSpeedMultiplier:10
		unitSpeedMultiplier_enabled:false
		unitSpeedMultiplier:5
		collectSpeedMultiplier_enabled:false
		collectSpeedMultiplier:10
		buildSpeedMultiplier_enabled:true
		buildSpeedMultiplier:500
		showOccupiedSpace:false
		showPathFinderCacheData:false
		showMovementPaths:true
		showPredictedPositions:true
		showOcean:true
		showHealthBarsForYou:true
		showHealthBarsForAllies:true
		showHealthBarsForNeutrals:true
		showHealthBarsForEnemies:true
		healthBarWidth:25
		healthBarHeight:2
		healthBarScale:true
		healthBarScale_baseDistance:10
	maps:{^}
		lastCameraPos:null
		lastCameraRot:null
		ui_main_activeTab:1
		ui_left_width:1.90068278715461
		ui_left_activeTab:1
		ui_right_width:2.79298811799066
		ui_right_activeTab:2
		selectedMap:""Island_Walls""
        selectedSoil:null
		tools:{^}
			terrain_resize:{left:0 right:8 back:0 front:8}
			terrain_shape:{brushSize:30 strength:3}
			terrain_selectChunk:{}
			regions_paint:{brushSize:4 strength:3}
			objects_place:{selectedOther:null}
	biomes:{^}
		ui_left_width:18.9297124600639
		ui_right_width:18.7699680511182
	objects:{^}
		ui_left_width:24.6006389776358
		ui_right_width:29.7124600638978
	ais:{^}
		selectedAI:null
	matches:{^}
		local_room:{^}
			playerSetups:[^]
				{enabled:true canBeAI:true ai:null}
				{enabled:true canBeAI:true}
				{enabled:false canBeAI:true ai:null}
				{enabled:false canBeAI:true ai:null}
				{enabled:false canBeAI:true ai:null}
				{enabled:false canBeAI:true ai:null}
			selectedMap:null
			wood:1000
			stone:1000
			grain:1000
			fruit:1000
			salt:1000
			fogOfWar:false
	live:{}";
			VDFLoader.ToVDFNode(vdf);
		}
	}
}