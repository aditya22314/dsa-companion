import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DailyPlan from './DailyPlan';
import { useStore } from '../store';
import { initialState } from '../store/initial';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/plan']}>
      <DailyPlan />
    </MemoryRouter>,
  );

describe('Daily plan page', () => {
  beforeEach(() => useStore.setState(initialState()));

  it('starts on Day 1 and moves to Day 2 after finishing', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Start: how loops think' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish day 1' }));
    expect(screen.getByRole('heading', { name: 'Functions, conditions, first loops' })).toBeInTheDocument();
    expect(useStore.getState().planDone[1]).toBeTruthy();
  });

  it('ticking a Namaste step marks those lessons as watched', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Done: Warm Up - Introduction + Programming 101' }));
    const st = useStore.getState();
    expect(st.lessonStatus['2:warm-up-introduction']?.watched).toBe(true);
    expect(st.lessonStatus['2:programming-101']?.watched).toBe(true);
    expect(st.planChecks['1:2']).toBe(true);
  });

  it('links app steps to the playground and lessons to Namaste DSA', () => {
    renderPage();
    expect(screen.getAllByRole('link', { name: 'Open in the app →' })[0]).toHaveAttribute('href', '/learn/loops');
    expect(screen.getAllByRole('link', { name: 'Open Namaste DSA ↗' })[0].getAttribute('href')).toMatch(/^https:\/\/namastedev\.com\//);
  });
});
