module.exports = function testAdapter(options) {
  describe('micro-analytics adapter ' + options.name, () => {
    const adapter = require(options.modulePath);

    if (typeof options.beforeEach === 'function') {
      beforeEach(async () => { await options.beforeEach(adapter); });
    }

    if (typeof options.afterEach === 'function') {
      afterEach(async () => { await options.afterEach(adapter); });
    }

    if (typeof options.beforeAll === 'function') {
      beforeAll(async () => { await options.beforeAll(adapter); });
    }

    if (typeof options.afterAll === 'function') {
      afterAll(async () => {
        await options.afterAll(adapter);
        if (typeof adapter.close === 'function') {
          await adapter.close();
        }
      });
    }

    it('should save and read', async () => {
      await adapter.put('/a-key', { views: [{ time: 1490623474639 }] });

      expect(await adapter.get('/a-key')).toEqual({
        views: [{ time: 1490623474639 }],
      });
    });

    it('should return all saves on getAll', async () => {
      await adapter.put('/a-key', { views: [{ time: 1490623474639 }] });
      await adapter.put('/another-key', { views: [{ time: 1490623474639 }] });

      expect(await adapter.getAll({ pathname: '/' })).toEqual({
        '/a-key': { views: [{ time: 1490623474639 }] },
        '/another-key': { views: [{ time: 1490623474639 }] },
      });
    });

    it('should have check whether a key is stored with has', async () => {
      await adapter.put('/a-key', { views: [{ time: 1490623474639 }] });

      expect(await adapter.has('/a-key')).toEqual(true);
      expect(await adapter.has('/non-existing-key')).toEqual(false);
    });

    if (typeof adapter.subscribe === "function") {

      it('should allow subscription with observables', async () => {
        const listener = jest.fn();
        const unsubscribe = adapter.subscribe(listener);

        await adapter.put('/a-key', { views: [{ time: 1490623474639 }] });

        expect(listener).toHaveBeenCalledWith({
          key: '/a-key',
          value: { views: [{ time: 1490623474639 }] },
        });
      });

      it('should allow multiple subscription with observables and handle unsubscribption', async () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        const subscription = adapter.subscribe(listener1);
        adapter.subscribe(listener2);

        await adapter.put('/a-key', { views: [{ time: 1490623474639 }] });
        subscription.unsubscribe();
        await adapter.put('/b-key', { views: [{ time: 1490623474639 }] });

        expect(listener1).toHaveBeenCalledWith({
          key: '/a-key',
          value: { views: [{ time: 1490623474639 }] },
        });
        expect(listener1).not.toHaveBeenCalledWith({
          key: '/b-key',
          value: { views: [{ time: 1490623474639 }] },
        });
        expect(listener2).toHaveBeenCalledWith({
          key: '/a-key',
          value: { views: [{ time: 1490623474639 }] },
        });
        expect(listener2).toHaveBeenCalledWith({
          key: '/b-key',
          value: { views: [{ time: 1490623474639 }] },
        });
      });
    }
  });
};
