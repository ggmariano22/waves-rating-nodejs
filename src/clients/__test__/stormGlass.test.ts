import { StormGlass } from '@src/clients/stormGlass';
import axios from 'axios'
import stormGlassWeatherAPIResponseFixture from '@test/fixtures/storm_glass_weather_3_hours.json';
import normalizedForecastFixture from '@test/fixtures/storm_glass_normalized_weather_3_hours.json';

jest.mock('axios');

describe('Storm glass client', () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>

    it('should return a forecast for 3 hours', async () => {
        const lat = -33.181981;
        const lon = 12.141961;

        mockedAxios.get.mockResolvedValue({data: stormGlassWeatherAPIResponseFixture});

        const stormGlass = new StormGlass(mockedAxios);
        const result = await stormGlass.fetchPoints(lat, lon);

        expect(result).toEqual(normalizedForecastFixture)
    })
})