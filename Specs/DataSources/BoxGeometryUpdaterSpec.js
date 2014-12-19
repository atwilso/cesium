/*global defineSuite*/
defineSuite([
        'DataSources/BoxGeometryUpdater',
        'Core/Cartesian3',
        'Core/Color',
        'Core/ColorGeometryInstanceAttribute',
        'Core/JulianDate',
        'Core/ShowGeometryInstanceAttribute',
        'Core/TimeInterval',
        'Core/TimeIntervalCollection',
        'DataSources/ColorMaterialProperty',
        'DataSources/ConstantProperty',
        'DataSources/ConstantPositionProperty',
        'DataSources/Entity',
        'DataSources/GridMaterialProperty',
        'DataSources/BoxGraphics',
        'DataSources/SampledProperty',
        'DataSources/TimeIntervalCollectionProperty',
        'Scene/PrimitiveCollection',
        'Specs/createDynamicProperty',
        'Specs/createScene',
        'Specs/destroyScene'
    ], function(
        BoxGeometryUpdater,
        Cartesian3,
        Color,
        ColorGeometryInstanceAttribute,
        JulianDate,
        ShowGeometryInstanceAttribute,
        TimeInterval,
        TimeIntervalCollection,
        ColorMaterialProperty,
        ConstantProperty,
        ConstantPositionProperty,
        Entity,
        GridMaterialProperty,
        BoxGraphics,
        SampledProperty,
        TimeIntervalCollectionProperty,
        PrimitiveCollection,
        createDynamicProperty,
        createScene,
        destroyScene) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn,runs,waits,waitsFor*/

    var scene;
    var time;

    beforeAll(function() {
        scene = createScene();
        time = JulianDate.now();
    });

    afterAll(function() {
        destroyScene(scene);
    });

    function createBasicBox() {
        var box = new BoxGraphics();
        box.minimumCorner = new ConstantPositionProperty(Cartesian3.fromDegrees(0, 0, 0));
        box.maximumCorner = new ConstantPositionProperty(Cartesian3.fromDegrees(1, 1, 1));
        var entity = new Entity();
        entity.box = box;
        return entity;
    }

    it('Constructor sets expected defaults', function() {
        var entity = new Entity();
        var updater = new BoxGeometryUpdater(entity, scene);

        expect(updater.isDestroyed()).toBe(false);
        expect(updater.entity).toBe(entity);
        expect(updater.isClosed).toBe(true);
        expect(updater.fillEnabled).toBe(false);
        expect(updater.fillMaterialProperty).toBe(undefined);
        expect(updater.outlineEnabled).toBe(false);
        expect(updater.hasConstantFill).toBe(true);
        expect(updater.hasConstantOutline).toBe(true);
        expect(updater.outlineColorProperty).toBe(undefined);
        expect(updater.outlineWidth).toBe(1.0);
        expect(updater.isDynamic).toBe(false);
        expect(updater.isOutlineVisible(time)).toBe(false);
        expect(updater.isFilled(time)).toBe(false);
        updater.destroy();
        expect(updater.isDestroyed()).toBe(true);
    });

    it('No geometry available when box is undefined ', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        entity.box = undefined;

        expect(updater.fillEnabled).toBe(false);
        expect(updater.outlineEnabled).toBe(false);
        expect(updater.isDynamic).toBe(false);
    });

    it('No geometry available when not filled or outline.', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        entity.box.fill = new ConstantProperty(false);
        entity.box.outline = new ConstantProperty(false);

        expect(updater.fillEnabled).toBe(false);
        expect(updater.outlineEnabled).toBe(false);
        expect(updater.isDynamic).toBe(false);
    });

    it('Values correct when using default graphics', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);

        expect(updater.isClosed).toBe(true);
        expect(updater.fillEnabled).toBe(true);
        expect(updater.fillMaterialProperty).toEqual(ColorMaterialProperty.fromColor(Color.WHITE));
        expect(updater.outlineEnabled).toBe(false);
        expect(updater.hasConstantFill).toBe(true);
        expect(updater.hasConstantOutline).toBe(true);
        expect(updater.outlineColorProperty).toBe(undefined);
        expect(updater.outlineWidth).toBe(1.0);
        expect(updater.isDynamic).toBe(false);
    });

    it('Box material is correctly exposed.', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        entity.box.material = new GridMaterialProperty(Color.BLUE);
        expect(updater.fillMaterialProperty).toBe(entity.box.material);
    });

    it('A time-varying outlineWidth causes geometry to be dynamic', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        entity.box.outlineWidth = createDynamicProperty();
        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying minimumCorner causes geometry to be dynamic', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        entity.box.minimumCorner = createDynamicProperty();

        expect(updater.isDynamic).toBe(true);
    });

    it('A time-varying maximumCorner causes geometry to be dynamic', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        entity.box.maximumCorner = createDynamicProperty();

        expect(updater.isDynamic).toBe(true);
    });

    function validateGeometryInstance(options) {
        var entity = createBasicBox();

        var box = entity.box;
        box.show = new ConstantProperty(options.show);
        box.fill = new ConstantProperty(options.fill);
        box.material = options.material;
        box.outline = new ConstantProperty(options.outline);
        box.outlineColor = new ConstantProperty(options.outlineColor);
        box.minimumCorner = new ConstantPositionProperty(options.minimumCorner);
        box.maximumCorner = new ConstantPositionProperty(options.maximumCorner);

        var updater = new BoxGeometryUpdater(entity, scene);

        var instance;
        var geometry;
        var attributes;
        if (options.fill) {
            instance = updater.createFillGeometryInstance(time);
            geometry = instance.geometry;
            expect(geometry._minimumCorner).toEqual(options.minimumCorner);
            expect(geometry._maximumCorner).toEqual(options.maximumCorner);

            attributes = instance.attributes;
            if (options.material instanceof ColorMaterialProperty) {
                expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(options.material.color.getValue(time)));
            } else {
                expect(attributes.color).toBeUndefined();
            }
            expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(options.fill));
        }

        if (options.outline) {
            instance = updater.createOutlineGeometryInstance(time);
            geometry = instance.geometry;
            expect(geometry._min).toEqual(options.minimumCorner);
            expect(geometry._max).toEqual(options.maximumCorner);

            attributes = instance.attributes;
            expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(options.outlineColor));
            expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(options.fill));
        }
    }

    it('Creates expected per-color geometry', function() {
        validateGeometryInstance({
            show : true,
            material : ColorMaterialProperty.fromColor(Color.RED),
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            minimumCorner : Cartesian3.fromDegrees(0, 0, 0),
            maximumCorner : Cartesian3.fromDegrees(1, 1, 1)
        });
    });

    it('Creates expected per-material geometry', function() {
        validateGeometryInstance({
            show : true,
            material : new GridMaterialProperty(),
            fill : true,
            outline : true,
            outlineColor : Color.BLUE,
            minimumCorner : Cartesian3.fromDegrees(0, 0, 0),
            maximumCorner : Cartesian3.fromDegrees(1, 1, 1)
        });
    });

    it('Correctly exposes outlineWidth', function() {
        var entity = createBasicBox();
        entity.box.outlineWidth = new ConstantProperty(8);
        var updater = new BoxGeometryUpdater(entity, scene);
        expect(updater.outlineWidth).toBe(8);
    });

    it('Attributes have expected values at creation time', function() {
        var time1 = new JulianDate(0, 0);
        var time2 = new JulianDate(10, 0);
        var time3 = new JulianDate(20, 0);

        var fill = new TimeIntervalCollectionProperty();
        fill.intervals.addInterval(new TimeInterval({
            start : time1,
            stop : time2,
            data : false
        }));
        fill.intervals.addInterval(new TimeInterval({
            start : time2,
            stop : time3,
            isStartIncluded : false,
            data : true
        }));

        var colorMaterial = new ColorMaterialProperty();
        colorMaterial.color = new SampledProperty(Color);
        colorMaterial.color.addSample(time, Color.YELLOW);
        colorMaterial.color.addSample(time2, Color.BLUE);
        colorMaterial.color.addSample(time3, Color.RED);

        var outline = new TimeIntervalCollectionProperty();
        outline.intervals.addInterval(new TimeInterval({
            start : time1,
            stop : time2,
            data : false
        }));
        outline.intervals.addInterval(new TimeInterval({
            start : time2,
            stop : time3,
            isStartIncluded : false,
            data : true
        }));

        var outlineColor = new SampledProperty(Color);
        outlineColor.addSample(time, Color.BLUE);
        outlineColor.addSample(time2, Color.RED);
        outlineColor.addSample(time3, Color.YELLOW);

        var entity = createBasicBox();
        entity.box.fill = fill;
        entity.box.material = colorMaterial;
        entity.box.outline = outline;
        entity.box.outlineColor = outlineColor;

        var updater = new BoxGeometryUpdater(entity, scene);

        var instance = updater.createFillGeometryInstance(time2);
        var attributes = instance.attributes;
        expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(colorMaterial.color.getValue(time2)));
        expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(fill.getValue(time2)));

        instance = updater.createOutlineGeometryInstance(time2);
        attributes = instance.attributes;
        expect(attributes.color.value).toEqual(ColorGeometryInstanceAttribute.toValue(outlineColor.getValue(time2)));
        expect(attributes.show.value).toEqual(ShowGeometryInstanceAttribute.toValue(outline.getValue(time2)));
    });

    it('dynamic updater sets properties', function() {
        var entity = new Entity();
        var box = new BoxGraphics();
        entity.box = box;

        box.show = createDynamicProperty(true);
        box.minimumCorner = createDynamicProperty(Cartesian3.fromDegrees(0, 0, 0));
        box.maximumCorner = createDynamicProperty(Cartesian3.fromDegrees(1, 1, 1));
        box.outline = createDynamicProperty(true);
        box.fill = createDynamicProperty(true);

        var updater = new BoxGeometryUpdater(entity, scene);
        var primitives = new PrimitiveCollection();
        var dynamicUpdater = updater.createDynamicUpdater(primitives);
        expect(primitives.length).toBe(0);

        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(2);
        expect(dynamicUpdater.isDestroyed()).toBe(false);

        expect(dynamicUpdater._options.id).toBe(entity);
        expect(dynamicUpdater._options.minimumCorner).toEqual(box.minimumCorner.getValue());
        expect(dynamicUpdater._options.maximumCorner).toEqual(box.maximumCorner.getValue());

        box.show.setValue(false);
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);

        box.show.setValue(true);
        box.fill.setValue(false);
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(1);

        box.fill.setValue(true);
        box.outline.setValue(false);
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(1);

        dynamicUpdater.destroy();
        expect(primitives.length).toBe(0);
        updater.destroy();
    });

    it('dynamic updater does not create primitives when minimumCorner.maximumCorner.getValue() is undefined', function() {
        var entity = new Entity();
        var box = new BoxGraphics();
        entity.box = box;

        box.show = createDynamicProperty(true);
        box.minimumCorner = createDynamicProperty(undefined);
        box.maximumCorner = createDynamicProperty(Cartesian3.fromDegrees(1, 1, 1));
        box.outline = createDynamicProperty(true);
        box.fill = createDynamicProperty(true);

        var updater = new BoxGeometryUpdater(entity, scene);
        var primitives = new PrimitiveCollection();
        var dynamicUpdater = updater.createDynamicUpdater(primitives);
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);

        box.minimumCorner.setValue(Cartesian3.fromDegrees(0, 0, 0));
        box.maximumCorner.setValue(undefined);
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(0);

        box.maximumCorner.setValue(Cartesian3.fromDegrees(1, 1, 1));
        dynamicUpdater.update(JulianDate.now());
        expect(primitives.length).toBe(2);
        updater.destroy();
    });

    it('geometryChanged event is raised when expected', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        var listener = jasmine.createSpy('listener');
        updater.geometryChanged.addEventListener(listener);

        entity.box.minimumCorner = new ConstantPositionProperty();
        expect(listener.callCount).toEqual(1);

        entity.box.maximumCorner = new ConstantPositionProperty();
        expect(listener.callCount).toEqual(2);

        entity.availability = new TimeIntervalCollection();
        expect(listener.callCount).toEqual(3);

        entity.box.minimumCorner = undefined;
        expect(listener.callCount).toEqual(4);

        //Since there's no valid geometry, changing another property should not raise the event.
        entity.box.height = undefined;

        //Modifying an unrelated property should not have any effect.
        entity.viewFrom = new ConstantProperty(Cartesian3.UNIT_X);
        expect(listener.callCount).toEqual(4);
    });

    it('createFillGeometryInstance throws if object is not filled', function() {
        var entity = new Entity();
        var updater = new BoxGeometryUpdater(entity, scene);
        expect(function() {
            return updater.createFillGeometryInstance(time);
        }).toThrowDeveloperError();
    });

    it('createFillGeometryInstance throws if no time provided', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        expect(function() {
            return updater.createFillGeometryInstance(undefined);
        }).toThrowDeveloperError();
    });

    it('createOutlineGeometryInstance throws if object is not outlined', function() {
        var entity = new Entity();
        var updater = new BoxGeometryUpdater(entity, scene);
        expect(function() {
            return updater.createOutlineGeometryInstance(time);
        }).toThrowDeveloperError();
    });

    it('createOutlineGeometryInstance throws if no time provided', function() {
        var entity = createBasicBox();
        entity.box.outline = new ConstantProperty(true);
        var updater = new BoxGeometryUpdater(entity, scene);
        expect(function() {
            return updater.createOutlineGeometryInstance(undefined);
        }).toThrowDeveloperError();
    });

    it('createDynamicUpdater throws if not dynamic', function() {
        var entity = createBasicBox();
        var updater = new BoxGeometryUpdater(entity, scene);
        expect(function() {
            return updater.createDynamicUpdater(new PrimitiveCollection());
        }).toThrowDeveloperError();
    });

    it('createDynamicUpdater throws if primitives undefined', function() {
        var entity = createBasicBox();
        entity.box.minimumCorner = createDynamicProperty(Cartesian3.ZERO);
        var updater = new BoxGeometryUpdater(entity, scene);
        expect(updater.isDynamic).toBe(true);
        expect(function() {
            return updater.createDynamicUpdater(undefined);
        }).toThrowDeveloperError();
    });

    it('dynamicUpdater.update throws if no time specified', function() {
        var entity = createBasicBox();
        entity.box.minimumCorner = createDynamicProperty(Cartesian3.ZERO);
        var updater = new BoxGeometryUpdater(entity, scene);
        var dynamicUpdater = updater.createDynamicUpdater(new PrimitiveCollection());
        expect(function() {
            dynamicUpdater.update(undefined);
        }).toThrowDeveloperError();
    });

    it('Constructor throws if no Entity supplied', function() {
        expect(function() {
            return new BoxGeometryUpdater(undefined, scene);
        }).toThrowDeveloperError();
    });

    it('Constructor throws if no scene supplied', function() {
        var entity = createBasicBox();
        expect(function() {
            return new BoxGeometryUpdater(entity, undefined);
        }).toThrowDeveloperError();
    });
});